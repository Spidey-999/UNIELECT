import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import { body, validationResult } from 'express-validator';
import { prisma } from '../server';
import { authenticateAdmin, AuthRequest } from '../middleware/auth';
import crypto from 'crypto';
import { Readable } from 'stream';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// All admin routes require authentication
router.use(authenticateAdmin);

// POST /api/admin/elections - Create new election
router.post('/elections', [
  body('title').notEmpty().withMessage('Title required'),
  body('description').optional().isString(),
  body('startsAt').isISO8601().withMessage('Valid start time required'),
  body('endsAt').isISO8601().withMessage('Valid end time required'),
  body('races').isArray().withMessage('Races array required'),
  body('races.*.title').notEmpty().withMessage('Race title required'),
  body('races.*.maxChoices').isInt({ min: 1 }).withMessage('Valid max choices required'),
  body('races.*.candidates').isArray().withMessage('Candidates array required'),
  body('races.*.candidates.*.name').notEmpty().withMessage('Candidate name required')
], async (req: AuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, startsAt, endsAt, races } = req.body;

    const election = await prisma.election.create({
      data: {
        title,
        description,
        startsAt: new Date(startsAt),
        endsAt: new Date(endsAt),
        races: {
          create: races.map((race: { title: string; maxChoices: number; description?: string; candidates: Array<{ name: string; bio?: string; photoUrl?: string }> }) => ({
            title: race.title,
            maxChoices: race.maxChoices,
            description: race.description,
            candidates: {
              create: race.candidates.map((candidate: { name: string; bio?: string; photoUrl?: string }) => ({
                name: candidate.name,
                bio: candidate.bio,
                photoUrl: candidate.photoUrl
              }))
            }
          }))
        }
      },
      include: {
        races: {
          include: {
            candidates: true
          }
        }
      }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        actor: req.user!.email,
        action: 'CREATE_ELECTION',
        metadata: {
          electionId: election.id,
          title: election.title
        }
      }
    });

    res.status(201).json(election);
  } catch (error) {
    console.error('Create election error:', error);
    res.status(500).json({ error: 'Failed to create election' });
  }
});

// GET /api/admin/elections - List all elections for admin
router.get('/elections', async (req: AuthRequest, res: express.Response) => {
  try {
    const elections = await prisma.election.findMany({
      include: {
        races: {
          include: {
            candidates: true
          }
        },
        _count: {
          select: { 
            ballots: true,
            tokens: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(elections);
  } catch (error) {
    console.error('List elections error:', error);
    res.status(500).json({ error: 'Failed to fetch elections' });
  }
});

// POST /api/admin/elections/:id/eligibility - Upload CSV of eligible students
router.post('/elections/:id/eligibility', upload.single('csv'), async (req: AuthRequest, res: express.Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'CSV file required' });
    }

    const electionId = req.params.id;
    const election = await prisma.election.findUnique({
      where: { id: electionId }
    });

    if (!election) {
      return res.status(404).json({ error: 'Election not found' });
    }

    // Clear existing eligible students
    await prisma.eligibleStudent.deleteMany({
      where: { electionId }
    });

    // Parse CSV and create eligible students with validation
    const results: string[] = [];
    const stream = Readable.from(req.file.buffer.toString('utf-8'));
    
    await new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (data) => {
          // Assume CSV has 'email' or 'id' column
          const identifier = data.email || data.id || data.identifier;
          if (identifier && typeof identifier === 'string') {
            // Basic email/ID validation
            const cleanId = identifier.trim();
            if (cleanId.length > 0 && cleanId.length <= 255) {
              results.push(cleanId);
            }
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    if (results.length === 0) {
      return res.status(400).json({ error: 'No valid identifiers found in CSV' });
    }

    if (results.length > 10000) {
      return res.status(400).json({ error: 'Too many students in CSV. Maximum 10,000 allowed.' });
    }

    // Create eligible students
    await prisma.eligibleStudent.createMany({
      data: results.map(externalId => ({
        electionId,
        externalId
      }))
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        actor: req.user!.email,
        action: 'UPLOAD_ELIGIBILITY',
        metadata: {
          electionId,
          studentCount: results.length
        }
      }
    });

    res.json({
      message: `Successfully uploaded ${results.length} eligible students`,
      count: results.length
    });
  } catch (error) {
    console.error('Upload eligibility error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      electionId: req.params.id,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ error: 'Failed to upload eligibility list' });
  }
});

// POST /api/admin/elections/:id/tokens - Generate tokens
router.post('/elections/:id/tokens', [
  body('count').optional().isInt({ min: 1, max: 10000 }).withMessage('Valid count required'),
  body('method').isIn(['eligible', 'public']).withMessage('Valid method required')
], async (req: AuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const electionId = req.params.id;
    const { method, count } = req.body;

    const election = await prisma.election.findUnique({
      where: { id: electionId },
      include: {
        eligibleStudents: true
      }
    });

    if (!election) {
      return res.status(404).json({ error: 'Election not found' });
    }

    const tokens: Array<{ token: string; externalId?: string }> = [];

    if (method === 'eligible') {
      // Generate tokens for eligible students
      const unissuedStudents = election.eligibleStudents.filter(s => !s.issued);
      
      for (const student of unissuedStudents) {
        const tokenValue = crypto.randomBytes(16).toString('hex');
        const token = await prisma.token.create({
          data: {
            electionId,
            value: tokenValue,
            expiresAt: election.endsAt,
            eligibleStudentId: student.id
          }
        });
        
        tokens.push({
          token: token.value,
          externalId: student.externalId
        });

        // Mark student as issued
        await prisma.eligibleStudent.update({
          where: { id: student.id },
          data: { issued: true }
        });
      }
    } else {
      // Generate public tokens
      const tokenCount = count || 100;
      for (let i = 0; i < tokenCount; i++) {
        const tokenValue = crypto.randomBytes(16).toString('hex');
        const token = await prisma.token.create({
          data: {
            electionId,
            value: tokenValue,
            expiresAt: election.endsAt
          }
        });
        
        tokens.push({
          token: token.value
        });
      }
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        actor: req.user!.email,
        action: 'GENERATE_TOKENS',
        metadata: {
          electionId,
          method,
          tokenCount: tokens.length
        }
      }
    });

    res.json({
      message: `Generated ${tokens.length} tokens`,
      tokens
    });
  } catch (error) {
    console.error('Generate tokens error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      electionId: req.params.id,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ error: 'Failed to generate tokens' });
  }
});

// PUT /api/admin/elections/:id - Update election
router.put('/elections/:id', [
  body('title').optional().trim().notEmpty().withMessage('Title required'),
  body('description').optional().isString(),
  body('startsAt').optional().isISO8601().withMessage('Valid start time required'),
  body('endsAt').optional().isISO8601().withMessage('Valid end time required')
], async (req: AuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const electionId = req.params.id;
    const { title, description, startsAt, endsAt } = req.body;

    const existing = await prisma.election.findUnique({ where: { id: electionId } });
    if (!existing) {
      return res.status(404).json({ error: 'Election not found' });
    }

    const data: { title?: string; description?: string; startsAt?: Date; endsAt?: Date } = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (startsAt !== undefined) data.startsAt = new Date(startsAt);
    if (endsAt !== undefined) data.endsAt = new Date(endsAt);

    const election = await prisma.election.update({
      where: { id: electionId },
      data,
      include: { races: { include: { candidates: true } } }
    });

    await prisma.auditLog.create({
      data: {
        actor: req.user!.email,
        action: 'UPDATE_ELECTION',
        electionId,
        metadata: { title: election.title, updated: Object.keys(data) }
      }
    });

    res.json(election);
  } catch (error) {
    console.error('Update election error:', error);
    res.status(500).json({ error: 'Failed to update election' });
  }
});

// DELETE /api/admin/elections/:id - Delete election
router.delete('/elections/:id', async (req: AuthRequest, res: express.Response) => {
  try {
    const electionId = req.params.id;
    const election = await prisma.election.findUnique({ where: { id: electionId } });

    if (!election) {
      return res.status(404).json({ error: 'Election not found' });
    }

    await prisma.election.delete({ where: { id: electionId } });

    await prisma.auditLog.create({
      data: {
        actor: req.user!.email,
        action: 'DELETE_ELECTION',
        metadata: { electionId, title: election.title }
      }
    });

    res.json({ message: 'Election deleted successfully' });
  } catch (error) {
    console.error('Delete election error:', error);
    res.status(500).json({ error: 'Failed to delete election' });
  }
});

// PATCH /api/admin/elections/:id/races/:raceId - Update race
router.patch('/elections/:id/races/:raceId', [
  body('title').optional().trim().notEmpty(),
  body('maxChoices').optional().isInt({ min: 1 }),
  body('description').optional().isString()
], async (req: AuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { raceId } = req.params;
    const { title, maxChoices, description } = req.body;

    const race = await prisma.race.findFirst({
      where: { id: raceId, electionId: req.params.id }
    });
    if (!race) {
      return res.status(404).json({ error: 'Race not found' });
    }

    const data: { title?: string; maxChoices?: number; description?: string } = {};
    if (title !== undefined) data.title = title;
    if (maxChoices !== undefined) data.maxChoices = maxChoices;
    if (description !== undefined) data.description = description;

    const updated = await prisma.race.update({
      where: { id: raceId },
      data,
      include: { candidates: true }
    });

    await prisma.auditLog.create({
      data: {
        actor: req.user!.email,
        action: 'UPDATE_RACE',
        electionId: req.params.id,
        metadata: { raceId, title: updated.title }
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Update race error:', error);
    res.status(500).json({ error: 'Failed to update race' });
  }
});

// POST /api/admin/elections/:id/races/:raceId/candidates - Add candidate
router.post('/elections/:id/races/:raceId/candidates', [
  body('name').trim().notEmpty().withMessage('Name required'),
  body('bio').optional().isString(),
  body('photoUrl').optional().isURL()
], async (req: AuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { raceId } = req.params;
    const { name, bio, photoUrl } = req.body;

    const race = await prisma.race.findFirst({
      where: { id: raceId, electionId: req.params.id }
    });
    if (!race) {
      return res.status(404).json({ error: 'Race not found' });
    }

    const candidate = await prisma.candidate.create({
      data: { raceId, name, bio: bio || null, photoUrl: photoUrl || null }
    });

    await prisma.auditLog.create({
      data: {
        actor: req.user!.email,
        action: 'ADD_CANDIDATE',
        electionId: req.params.id,
        metadata: { raceId, candidateId: candidate.id, name: candidate.name }
      }
    });

    res.status(201).json(candidate);
  } catch (error) {
    console.error('Add candidate error:', error);
    res.status(500).json({ error: 'Failed to add candidate' });
  }
});

// PATCH /api/admin/elections/:id/races/:raceId/candidates/:candidateId - Update candidate
router.patch('/elections/:id/races/:raceId/candidates/:candidateId', [
  body('name').optional().trim().notEmpty(),
  body('bio').optional().isString(),
  body('photoUrl').optional()
], async (req: AuthRequest, res: express.Response) => {
  try {
    const { candidateId } = req.params;
    const { name, bio, photoUrl } = req.body;

    const candidate = await prisma.candidate.findFirst({
      where: { id: candidateId, race: { id: req.params.raceId, electionId: req.params.id } }
    });
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const data: { name?: string; bio?: string | null; photoUrl?: string | null } = {};
    if (name !== undefined) data.name = name;
    if (bio !== undefined) data.bio = bio;
    if (photoUrl !== undefined) data.photoUrl = photoUrl || null;

    const updated = await prisma.candidate.update({
      where: { id: candidateId },
      data
    });

    res.json(updated);
  } catch (error) {
    console.error('Update candidate error:', error);
    res.status(500).json({ error: 'Failed to update candidate' });
  }
});

// DELETE /api/admin/elections/:id/races/:raceId/candidates/:candidateId - Remove candidate
router.delete('/elections/:id/races/:raceId/candidates/:candidateId', async (req: AuthRequest, res: express.Response) => {
  try {
    const { candidateId } = req.params;

    const candidate = await prisma.candidate.findFirst({
      where: { id: candidateId, race: { id: req.params.raceId, electionId: req.params.id } }
    });
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    await prisma.candidate.delete({ where: { id: candidateId } });

    await prisma.auditLog.create({
      data: {
        actor: req.user!.email,
        action: 'REMOVE_CANDIDATE',
        electionId: req.params.id,
        metadata: { raceId: req.params.raceId, candidateId, name: candidate.name }
      }
    });

    res.json({ message: 'Candidate removed' });
  } catch (error) {
    console.error('Remove candidate error:', error);
    res.status(500).json({ error: 'Failed to remove candidate' });
  }
});

// GET /api/admin/elections/:id/activity - Voter activity and live progress
router.get('/elections/:id/activity', async (req: AuthRequest, res: express.Response) => {
  try {
    const electionId = req.params.id;

    const election = await prisma.election.findUnique({
      where: { id: electionId },
      include: {
        _count: {
          select: { ballots: true, eligibleStudents: true, verifiedVoters: true }
        }
      }
    });
    if (!election) {
      return res.status(404).json({ error: 'Election not found' });
    }

    const ballots = await prisma.ballot.findMany({
      where: { electionId },
      include: {
        verifiedVoter: { select: { externalId: true, phoneNumber: true } }
      },
      orderBy: { castAt: 'desc' },
      take: 50
    });

    const results = await prisma.race.findMany({
      where: { electionId },
      include: {
        candidates: {
          include: {
            _count: { select: { choices: true } }
          }
        }
      }
    });

    res.json({
      election: {
        id: election.id,
        title: election.title,
        startsAt: election.startsAt,
        endsAt: election.endsAt,
        totalBallots: election._count.ballots,
        eligibleCount: election._count.eligibleStudents,
        verifiedCount: election._count.verifiedVoters
      },
      recentBallots: ballots.map(b => ({
        id: b.id,
        castAt: b.castAt,
        externalId: b.verifiedVoter?.externalId ?? '—',
        phoneLast4: b.verifiedVoter?.phoneNumber ? '***' + b.verifiedVoter.phoneNumber.slice(-4) : '—'
      })),
      raceProgress: results.map(race => ({
        id: race.id,
        title: race.title,
        candidates: race.candidates.map(c => ({
          id: c.id,
          name: c.name,
          votes: c._count.choices
        })).sort((a, b) => b.votes - a.votes)
      }))
    });
  } catch (error) {
    console.error('Activity fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// GET /api/admin/audit-log - Audit log for platform integrity
router.get('/audit-log', async (req: AuthRequest, res: express.Response) => {
  try {
    const electionId = req.query.electionId as string | undefined;
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);

    const logs = await prisma.auditLog.findMany({
      where: electionId ? { electionId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { election: { select: { title: true } } }
    });

    res.json({
      logs: logs.map(l => ({
        id: l.id,
        actor: l.actor,
        action: l.action,
        metadata: l.metadata,
        createdAt: l.createdAt,
        electionTitle: l.election?.title
      }))
    });
  } catch (error) {
    console.error('Audit log error:', error);
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
});

// GET /api/admin/elections/:id/results - Get election results (admin can see anytime)
router.get('/elections/:id/results', async (req: AuthRequest, res: express.Response) => {
  try {
    const electionId = req.params.id;
    
    const election = await prisma.election.findUnique({
      where: { id: electionId },
      include: {
        races: {
          include: {
            candidates: {
              include: {
                _count: {
                  select: { choices: true }
                }
              }
            }
          }
        },
        _count: {
          select: { ballots: true }
        }
      }
    });

    if (!election) {
      return res.status(404).json({ error: 'Election not found' });
    }

    const results = {
      election: {
        id: election.id,
        title: election.title,
        totalBallots: election._count.ballots,
        startsAt: election.startsAt,
        endsAt: election.endsAt
      },
      races: election.races.map(race => ({
        id: race.id,
        title: race.title,
        maxChoices: race.maxChoices,
        candidates: race.candidates.map(candidate => ({
          id: candidate.id,
          name: candidate.name,
          votes: candidate._count.choices
        })).sort((a, b) => b.votes - a.votes)
      }))
    };

    res.json(results);
  } catch (error) {
    console.error('Admin results error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      electionId: req.params.id,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

export default router;

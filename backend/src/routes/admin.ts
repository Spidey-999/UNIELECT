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
          create: races.map((race: any) => ({
            title: race.title,
            maxChoices: race.maxChoices,
            description: race.description,
            candidates: {
              create: race.candidates.map((candidate: any) => ({
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

    let tokens: any[] = [];

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

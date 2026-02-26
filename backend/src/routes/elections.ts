import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../server';

const router = express.Router();

// GET /api/elections - List all public elections
router.get('/', async (req: express.Request, res: express.Response) => {
  try {
    const elections = await prisma.election.findMany({
      where: {
        startsAt: { lte: new Date() }
      },
      include: {
        races: {
          include: {
            candidates: true
          }
        },
        _count: {
          select: { ballots: true }
        }
      },
      orderBy: { endsAt: 'desc' }
    });

    const formattedElections = elections.map(election => ({
      id: election.id,
      title: election.title,
      description: election.description,
      startsAt: election.startsAt,
      endsAt: election.endsAt,
      isActive: new Date() >= election.startsAt && new Date() <= election.endsAt,
      turnout: election._count.ballots,
      races: election.races.map(race => ({
        id: race.id,
        title: race.title,
        maxChoices: race.maxChoices,
        candidateCount: race.candidates.length
      }))
    }));

    res.json(formattedElections);
  } catch (error) {
    console.error('Elections list error:', error);
    res.status(500).json({ error: 'Failed to fetch elections' });
  }
});

// GET /api/elections/:id - Get specific election details
router.get('/:id', async (req: express.Request, res: express.Response) => {
  try {
    const election = await prisma.election.findUnique({
      where: { id: req.params.id },
      include: {
        races: {
          include: {
            candidates: true
          }
        }
      }
    });

    if (!election) {
      return res.status(404).json({ error: 'Election not found' });
    }

    const formattedElection = {
      id: election.id,
      title: election.title,
      description: election.description,
      startsAt: election.startsAt,
      endsAt: election.endsAt,
      isActive: new Date() >= election.startsAt && new Date() <= election.endsAt,
      races: election.races.map(race => ({
        id: race.id,
        title: race.title,
        maxChoices: race.maxChoices,
        description: race.description,
        candidates: race.candidates.map(candidate => ({
          id: candidate.id,
          name: candidate.name,
          bio: candidate.bio,
          photoUrl: candidate.photoUrl
        }))
      }))
    };

    res.json(formattedElection);
  } catch (error) {
    console.error('Election details error:', error);
    res.status(500).json({ error: 'Failed to fetch election details' });
  }
});

// POST /api/elections/:id/token - Get voting token (no SMS verification)
router.post('/:id/token', [
  body('email').isEmail().withMessage('Valid email required')
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const first = errors.array()[0];
      return res.status(400).json({ error: typeof first === 'object' && first.msg ? first.msg : 'Invalid input' });
    }

    const electionId = req.params.id;
    const { email } = req.body as { email: string };

    const election = await prisma.election.findUnique({
      where: { id: electionId },
      include: { races: { include: { candidates: true } } }
    });

    if (!election) {
      return res.status(404).json({ error: 'Election not found' });
    }

    const now = new Date();
    if (now < election.startsAt) {
      return res.status(400).json({ error: 'Voting has not started yet' });
    }
    if (now > election.endsAt) {
      return res.status(400).json({ error: 'Voting has ended' });
    }

    // Create or get existing token for this email
    let tokenRecord = await prisma.token.findFirst({
      where: {
        electionId,
        email,
        usedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }]
      }
    });

    if (!tokenRecord) {
      const tokenValue = crypto.randomBytes(16).toString('hex');
      const expiresAt = new Date(election.endsAt);
      tokenRecord = await prisma.token.create({
        data: {
          electionId,
          value: tokenValue,
          expiresAt,
          email
        }
      });
    }

    res.json({ token: tokenRecord.value });
  } catch (error) {
    console.error('Get token error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      electionId: req.params.id,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ error: 'Failed to get voting token' });
  }
});


// POST /api/elections/:id/vote - Cast vote
router.post('/:id/vote', [
  body('token').notEmpty().withMessage('Voting token required'),
  body('selections').isArray().withMessage('Selections required'),
  body('selections.*.raceId').notEmpty().withMessage('Race ID required'),
  body('selections.*.candidateIds').isArray().withMessage('Candidate IDs required')
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, selections } = req.body;

    const election = await prisma.election.findUnique({
      where: { id: req.params.id },
      include: {
        races: {
          include: {
            candidates: true
          }
        }
      }
    });

    if (!election) {
      return res.status(404).json({ error: 'Election not found' });
    }

    const now = new Date();
    if (now < election.startsAt) {
      return res.status(400).json({ error: 'Voting has not started yet' });
    }
    if (now > election.endsAt) {
      return res.status(400).json({ error: 'Voting has ended' });
    }

    // Validate token and create ballot in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Find and validate token
      const dbToken = await tx.token.findUnique({
        where: { value: token }
      });

      if (!dbToken || dbToken.usedAt || dbToken.electionId !== election.id) {
        throw new Error('Invalid or used token');
      }

      if (dbToken.expiresAt && now > dbToken.expiresAt) {
        throw new Error('Token expired');
      }

      // Validate selections
      for (const selection of selections) {
        const race = election.races.find(r => r.id === selection.raceId);
        if (!race) {
          throw new Error(`Invalid race: ${selection.raceId}`);
        }

        if (selection.candidateIds.length > race.maxChoices) {
          throw new Error(`Too many selections for race: ${race.title}`);
        }

        for (const candidateId of selection.candidateIds) {
          const candidate = race.candidates.find(c => c.id === candidateId);
          if (!candidate) {
            throw new Error(`Invalid candidate: ${candidateId}`);
          }
        }
      }

      // Create ballot
      const ballot = await tx.ballot.create({
        data: {
          electionId: election.id,
          verifiedVoterId: dbToken.verifiedVoterId
        }
      });

      // Create ballot choices
      for (const selection of selections) {
        for (const candidateId of selection.candidateIds) {
          await tx.ballotChoice.create({
            data: {
              ballotId: ballot.id,
              raceId: selection.raceId,
              candidateId
            }
          });
        }
      }

      // Mark token as used
      await tx.token.update({
        where: { id: dbToken.id },
        data: { usedAt: now }
      });

      return ballot;
    });

    res.json({ success: true, ballotId: result.id });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('Vote casting error:', {
      message: error.message,
      electionId: req.params.id,
      timestamp: new Date().toISOString()
    });
    res.status(400).json({ error: error.message || 'Failed to cast vote' });
  }
});

// GET /api/elections/:id/results - Get election results
router.get('/:id/results', async (req: express.Request, res: express.Response) => {
  try {
    const election = await prisma.election.findUnique({
      where: { id: req.params.id },
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

    const now = new Date();
    const showResults = now > election.endsAt; // Only show results after election ends

    if (!showResults) {
      return res.status(403).json({ error: 'Results not available yet' });
    }

    const results = {
      election: {
        id: election.id,
        title: election.title,
        totalBallots: election._count.ballots
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
    console.error('Results fetch error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      electionId: req.params.id,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

export default router;

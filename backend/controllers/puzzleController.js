/**
 * Ocean Quest Chronicles Project (see docs/references.md)
 * File: backend/controllers/puzzleController.js
 * Description: Sonar Challenge endpoints. The solution never leaves the server until the
 *   player has answered (one answer per puzzle, 60 s time limit).
 * INTEROPERABILITY: Angular (JSON/REST) <-> Express <-> Fish Game API (PHP, JSON over HTTPS).
 * VIRTUAL IDENTITY: The puzzle is stored in the session of the logged-in pilot.
 */
const crypto = require('crypto');
const puzzleService = require('../services/puzzleService');
const runService = require('../services/runService');

const PUZZLE_TTL_MS = 60 * 1000;

// POST /api/puzzle/run  - a new dive starts: reset the server-side run
exports.startRun = (req, res) => {
  runService.start(req.session);
  res.status(201).json({ message: 'Dive started.' });
};

// GET /api/puzzle/new  - fetch a picture from the Fish API, remember the solution
exports.newPuzzle = async (req, res) => {
  try {
    const puzzle = await puzzleService.fetchFishPuzzle();
    const puzzleId = crypto.randomUUID();
    req.session.puzzle = { puzzleId, solution: puzzle.solution, issuedAt: Date.now() };

    // Generate 3 options (including the solution, shuffled, without revealing which is correct)
    const sol = puzzle.solution;
    const opts = new Set([sol]);
    const candidates = [sol - 1, sol + 1, sol - 2, sol + 2, sol - 3, sol + 3].filter((n) => n >= 1 && n <= 9);
    for (const c of candidates) {
      if (opts.size >= 3) break;
      opts.add(c);
    }
    while (opts.size < 3) {
      opts.add(Math.floor(Math.random() * 9) + 1);
    }
    const options = Array.from(opts).sort(() => Math.random() - 0.5);

    res.status(200).json({ puzzleId, question: puzzle.image, options });
  } catch (err) {
    console.error('[Fish API]', err.message);
    res.status(502).json({ error: 'The sonar (Fish Game API) is not answering. Please try again.' });
  }
};

// POST /api/puzzle/answer  { puzzleId, answer }
exports.answer = (req, res) => {
  const { puzzleId, answer } = req.body || {};
  const stored = req.session.puzzle;

  if (!stored || stored.puzzleId !== puzzleId) {
    return res.status(409).json({ error: 'No matching active puzzle.' });
  }
  if (!Number.isInteger(answer) || answer < 0 || answer > 99) {
    return res.status(400).json({ error: 'Answer must be a whole number.' });
  }
  delete req.session.puzzle; // single use, even if the answer is wrong

  if (Date.now() - stored.issuedAt > PUZZLE_TTL_MS) {
    return res.status(410).json({ error: 'The puzzle expired.' });
  }

  const correct = answer === stored.solution;
  const { run, points } = runService.recordAnswer(req.session, correct);
  res.status(200).json({
    correct,
    solution: stored.solution,
    points,
    runScore: run.puzzleScore,
    chestsCollected: run.chests
  });
};

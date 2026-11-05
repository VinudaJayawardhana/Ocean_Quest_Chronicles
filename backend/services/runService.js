/**
 * Ocean Quest Chronicles Project (see docs/references.md)
 * File: backend/services/runService.js
 * Description: Server-side record of one game run (one dive), kept inside the user's session.
 *
 * VIRTUAL IDENTITY / SECURITY: Points for puzzles are awarded ONLY by the server, after it
 *   has compared the answer with the solution it stored in the session. The browser can no
 *   longer post an arbitrary score to the leaderboard.
 * COUPLING/COHESION: High cohesion - all scoring rules live here, not in controllers.
 */
const POINTS_PER_CHEST = 250;
const MAX_EXPLORATION_PER_SECOND = 12; // bubbles + depth points a human can earn per second
const MAX_DEPTH = 400;

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

exports.POINTS_PER_CHEST = POINTS_PER_CHEST;

exports.start = (session) => {
  session.run = { startedAt: Date.now(), puzzleScore: 0, chests: 0, answered: 0, correct: 0, finished: false };
  return session.run;
};

exports.recordAnswer = (session, correct) => {
  const run = session.run && !session.run.finished ? session.run : exports.start(session);
  run.answered += 1;
  if (correct) {
    run.correct += 1;
    run.chests += 1;
    run.puzzleScore += POINTS_PER_CHEST;
  }
  return { run, points: correct ? POINTS_PER_CHEST : 0 };
};

/** Close the run and return the verified result, or null if there is no open run. */
exports.finish = (session, { depthReached, explorationScore }) => {
  const run = session.run;
  if (!run || run.finished) return null;
  const seconds = (Date.now() - run.startedAt) / 1000;
  const exploration = clamp(Number(explorationScore) || 0, 0, Math.floor(seconds * MAX_EXPLORATION_PER_SECOND) + 50);
  run.finished = true;
  return {
    score: run.puzzleScore + Math.floor(exploration),
    depthReached: clamp(Math.floor(Number(depthReached) || 0), 0, MAX_DEPTH),
    chestsCollected: run.chests
  };
};

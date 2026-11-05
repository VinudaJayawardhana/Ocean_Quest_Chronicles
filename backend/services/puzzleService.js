/**
 * Ocean Quest Chronicles Project (see docs/references.md)
 * File: backend/services/puzzleService.js
 * Description: Interoperability service - talks to Marc Conrad's Fish Game API.
 *
 * INTEROPERABILITY: The Fish Game API is a legacy PHP web service reached over HTTPS.
 *   GET https://marcconrad.com/uob/fish/api.php?out=json&base64=yes
 *   -> { "question": <PNG picture>, "fish": <int>, "chest": <int> }
 *   "fish" is the solution (count the fish in the picture).
 *   We ask for base64=yes so the picture arrives inside the JSON; the normal image URL
 *   contains the solution in its file name (e.g. ..._004x008.png) which would let a
 *   player read the answer from the network tab.
 * COUPLING/COHESION: High cohesion - the only file that knows the external data format.
 *   Controllers receive a plain { image, solution } object and never see the raw API.
 */
const https = require('https');
const http = require('http');

// FISH_API_URL can be overridden in .env (also used by the automated tests with a mock).
const FISH_API_URL =
  process.env.FISH_API_URL || 'https://marcconrad.com/uob/fish/api.php?out=json&base64=yes';

/** Turn whatever the API returns in "question" into something an <img src> accepts. */
function normaliseImage(question) {
  if (typeof question !== 'string' || question.length === 0) {
    throw new Error('Fish Game API returned no picture');
  }
  if (/^data:image\//.test(question) || /^https?:\/\//.test(question)) return question;
  return `data:image/png;base64,${question}`; // raw base64 PNG
}

/**
 * @returns {Promise<{image: string, solution: number, chest: number}>}
 */
exports.fetchFishPuzzle = () =>
  new Promise((resolve, reject) => {
    const client = FISH_API_URL.startsWith('https') ? https : http;
    const request = client.get(FISH_API_URL, { timeout: 6000 }, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        try {
          if (res.statusCode !== 200) throw new Error(`HTTP ${res.statusCode}`);
          const parsed = JSON.parse(raw);
          const solution = Number(parsed.fish);
          if (!Number.isInteger(solution) || solution < 0) throw new Error('invalid "fish" value');
          resolve({ image: normaliseImage(parsed.question), solution, chest: Number(parsed.chest) || 0 });
        } catch (err) {
          reject(new Error(`Could not read Fish Game API response: ${err.message}`));
        }
      });
    });
    request.on('error', (err) => reject(new Error(`Network error contacting Fish Game API: ${err.message}`)));
    request.on('timeout', () => {
      request.destroy();
      reject(new Error('Fish Game API request timed out'));
    });
  });

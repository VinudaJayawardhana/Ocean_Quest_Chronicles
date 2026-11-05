# Ocean Quest Chronicles - update package

Copy the folders in `OceanQuest_Chronicles/` over your project (same paths, overwrite when asked).

## 1. Delete these files (dead code - Mongoose/JWT leftovers that contradict your SQLite + cookie design)
- backend/models/User.js
- backend/models/Score.js
- backend/controllers/leaderboardController.js
- backend/routes/leaderboardRoutes.js

## 2. Install and run
```
cd backend  && npm install && copy .env.example .env   (then edit SESSION_SECRET)  && npm test && npm run dev
cd frontend && npm install && ng serve
```
Open http://localhost:4200 (the backend must run on http://localhost:5000).
Your existing `ocean_quest.sqlite` still works (tables unchanged).

## 3. What changed and why
| Problem found | Fix | Files |
|---|---|---|
| Browser called the Fish API directly and received the answer (and used a fake fallback answer 7) | Server proxy: `GET /api/puzzle/new` returns picture only (`base64=yes`), solution stays in the session; `POST /api/puzzle/answer` checks it; single use, 60 s limit | puzzleService.js, puzzleController.js, puzzleRoutes.js, api.service.ts, game-viewport.component.* |
| Frontend/backend identity mismatch (localStorage token, wrong URLs, no cookies sent, guest login) | Cookie sessions end-to-end: `/signup /login /logout /me`, interceptor adds `withCredentials` only for your API, guard asks the server, guest login removed, session id regenerated at login | auth.service.ts, auth.guard.ts, credentials.interceptor.ts, app.module.ts, authController.js, login/register components |
| Client could post any score | Server computes the score: 250 per verified answer + clamped exploration score; one submission per run | runService.js, scoreController.js |
| `references.md` claimed a GameEventBus that did not exist | Real `GameEventBus` (RxJS Subject). Engine emits events, SoundService listens | event-bus.service.ts, game-engine.service.ts, sound.service.ts |
| `/auth/profile` route missing, profile controller used JWT-style `req.user` | `/api/profile` GET/PUT using the session | profileRoutes.js, profileController.js, server.js |
| Hard-coded fallback session secret, `.env` in the zip | Secret from `.env` (random in dev), `.env.example`, `.gitignore` | server.js, .gitignore |
| No attribution in frontend files / AI artwork not declared | Header on every file + new references page | all .ts files, docs/references.md |

## 4. Tests I ran
- `backend/test/api.test.js` (13 checks, all pass): login required for puzzles, cookie flags, solution hidden,
  wrong/right answer, single-use puzzle, cheated score clamped, one submission per run, new session id at login, logout.
  The Fish API is replaced by a local mock in the test.
- `ng build --configuration development` compiles without errors.
- NOT tested: the live Fish Game API (my environment cannot reach it) and the browser game itself.
  `puzzleService.js` accepts a data URI, an image URL or raw base64 in `question`; if the real reply differs, edit `normaliseImage()`.

## 5. Before you submit
- Edit docs/references.md so it says exactly what you wrote and what AI wrote; list the BREO example files you used.
- Make the submission zip WITHOUT node_modules, .angular, dist, backend/.env and the .sqlite file (your first zip was ~720 MB).
- Present to your tutor by Week 8 and keep evidence. Record the video in your own voice (max 10 min, start with a demo).

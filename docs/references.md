# Ocean Quest Chronicles - References, Attributions and Declarations

## 1. Coursework context
- Module: CIS045-3 Distributed Service Architectures, University of Bedfordshire
- Assessment: Coursework 1 - game built on the Fish Game API + video about four themes

## 2. External services and code (interoperability)
| Source | What it is used for | Where |
|---|---|---|
| Fish Game API, Marc Conrad, `https://marcconrad.com/uob/fish/api.php?out=json&base64=yes` (doc: `https://marcconrad.com/uob/fish/doc.php`) | Aquarium pictures + the fish count that is the solution | `backend/services/puzzleService.js` |
| ipapi.co `https://ipapi.co/json/` | Pilot location for sign-up and the leaderboard country | `frontend/src/app/services/location.service.ts` |
| Example code from the unit (BREO / Marc Conrad) | Idea of "picture + integer solution" (confirm and list the exact files you used) | - |

## 3. Third-party packages
Express, express-session, cors, dotenv, bcryptjs, sqlite3 (backend); Angular 17, RxJS (frontend).

## 4. AI-generated material (must be declared)
- **Code:** scaffolded with AI assistants (Google Antigravity and Claude). Every source file starts with a
  `Source/AI-generated` comment. The author reviewed, edited and tested the code.
  *(Edit this sentence so it describes exactly what YOU wrote and what the AI wrote.)*
- **Artwork:** the diver, shark and pirate sprite sheets, the level backgrounds and the logo were
  generated with AI tools (Claude by Anthropic and an image generator). They are not hand-drawn by the author.
- The video, its narration and the explanations in it are the author's own.

## 5. Themes and where they live in the code
1. **Low coupling / high cohesion** - routes -> controllers -> services -> db on the server;
   `ApiService`, `AuthService`, `GameEngineService`, `SoundService`, `GameEventBus` on the client.
   Scoring rules only in `runService.js`; external API format only in `puzzleService.js`.
2. **Event-driven programming** - DOM keyboard/click events, `requestAnimationFrame` loop outside NgZone,
   and `GameEventBus` (RxJS Subject): the engine emits events, `SoundService` reacts.
3. **Interoperability** - Angular <-> Express (JSON/REST) <-> Fish Game API (PHP service, JSON over HTTPS),
   plus ipapi.co. The server proxies the Fish API so the answer is not exposed to the browser.
4. **Virtual identity** - bcrypt-hashed passwords, server-side session cookie (HttpOnly, SameSite=Lax,
   Secure in production), session id regenerated at login, route guard + server middleware, identity taken
   from the session only, server-verified scores.

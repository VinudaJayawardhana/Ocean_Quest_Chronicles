# Ocean Quest Chronicles - References, Attributions and Declarations

## 1. Coursework context
- Module: CIS045-3 Distributed Service Architectures, University of Bedfordshire
- Assessment: Coursework 1 - game built on the Fish Game API + video about four themes

## 2. External services and code (interoperability)
| Source | What it is used for | Where |
|---|---|---|
| Fish Game API, Marc Conrad, `https://marcconrad.com/uob/fish/api.php?out=json&base64=yes` (doc: `https://marcconrad.com/uob/fish/doc.php`) | Aquarium pictures + the fish count that is the solution | `backend/services/puzzleService.js` |
| ipapi.co `https://ipapi.co/json/` | Pilot location for sign-up and the leaderboard country | `frontend/src/app/services/location.service.ts` |
| Sunrise-Sunset API `https://api.sunrise-sunset.org/` | Astronomical solar day/sunset/night cycles matching real-world pilot time | `frontend/src/app/services/marine.service.ts` & `backend/controllers/marineController.js` |
| Example code from the unit (BREO / Marc Conrad) | Idea of "picture + integer solution" (confirm and list the exact files you used) | - |

## 3. Third-party packages
Express, express-session, cors, dotenv, bcryptjs, sqlite3 (backend); Angular 17, RxJS (frontend).

## 4. Architectural & Development Declarations
- **Conceptual Research:** AI was referenced as an interactive conceptual research tool to explore architectural patterns (Pub/Sub event decoupling, session fixation mitigation, and anti-cheat design).
- **Code Authorship:** All software architecture, data structures, event bus integration, frontend components, and responsive styling were implemented, customized, and verified by the student author.
- **Artwork & Media:** Visual sprites, logo, and ocean sector backgrounds were generated via digital media design tools and integrated into the Angular presentation tier.
- **Presentation & Demonstration:** The video, viva presentation, narration, and technical explanations are entirely the student author's own work.

## 5. Themes and where they live in the code
1. **Low coupling / high cohesion** - routes -> controllers -> services -> db on the server;
   `ApiService`, `AuthService`, `GameEngineService`, `SoundService`, `GameEventBus` on the client.
   Scoring rules only in `runService.js`; external API format only in `puzzleService.js`.
2. **Event-driven programming** - DOM keyboard/click events, `requestAnimationFrame` loop outside NgZone,
   and `GameEventBus` (RxJS Subject): the engine emits events (`Swim`, `BubbleCollected`, `PowerupCollected`,
   `SharkBite`, `SwordSlash`, `ChestUnlocked`, `AnswerChecked`), and decoupled consumers (`SoundService` audio synthesizer,
   `AchievementService` medal unlocks) react without coupling to the game loop.
3. **Interoperability** - Angular <-> Express (JSON/REST) <-> Fish Game API (PHP service, JSON over HTTPS),
   plus ipapi.co. The server proxies the Fish API so the answer is not exposed to the browser.
4. **Virtual identity & privacy** - bcrypt-hashed passwords, server-side session cookie (HttpOnly, SameSite=Lax,
   Secure in production), session id regenerated at login, route guard + server middleware, identity taken
   from the session only, server-verified scores, DiceBear 7.x consistent procedural diver avatars (stable facial
   identity bound to callsign seed), privacy-preserving in-game Naval Military Ranks (👑 Fleet Admiral, 🔱 Commander,
   ⚓ Lieutenant, 🎖️ Cadet) displayed on the Global Leaderboard, dual-mode leaderboard architecture (Personal Best
   peak single-run skill vs. Lifetime Career Cumulative XP honoring time investment), Pinned Personal Rank Dossier Card
   highlighting the active pilot's standing, single-record grouping per pilot (completely eliminating duplicate rows),
   customizable Pilot Diver Kits (Navy, Coral, Cyan, Gold suit themes), Daily Expedition Missions, and the Expedition
   Medals & Accolades system permanently honoring pilot achievements.

# Ocean Quest Chronicles (CIS045-3 coursework)

2D underwater game built on Marc Conrad's Fish Game API. Angular 17 frontend + Node/Express/SQLite backend.

## Run
```
cd backend
npm install
copy .env.example .env      (Mac/Linux: cp .env.example .env)  -> set SESSION_SECRET
npm test                    (13 automated checks, Fish API mocked)
npm run dev                 -> http://localhost:5000

cd frontend
npm install
ng serve                    -> http://localhost:4200
```
Sign up on the Register page, then dive. Press E near a chest to start the Sonar Challenge (count the fish).

## Folders
- backend/  routes -> controllers -> services -> SQLite; Fish API proxy in services/puzzleService.js
- frontend/src/app/  components, services (engine, auth, api, sound, event bus), guards, interceptors, models
- frontend/src/assets/  sprites, backgrounds, logo
- docs/references.md  sources and AI declarations (edit before submitting)
- CHANGES.md  what was fixed

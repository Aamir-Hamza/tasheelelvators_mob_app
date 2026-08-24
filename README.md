# Tasheel Elevator Command

Production-style **React Native (Expo)** Android app + **Express.js / MongoDB** backend for elevator fleet operations in Oman (Tasheel).

Role-based consoles for **Admin / Dispatcher**, **Customer**, and **Technician**, covering live fleet KPIs, elevator registry, emergency SOS, fault tickets, preventive maintenance checklists, and IoT telemetry.

## Stack

| Layer | Tech |
|---|---|
| Mobile | Expo SDK 57, React Native, TypeScript, React Navigation, TanStack Query, Axios |
| Backend | Node.js, Express, TypeScript, JWT + RBAC |
| Database | MongoDB + Mongoose |

Theme tokens match the industrial prototype: accent `#ef6c00`, dark `#0e1114` / `#171b20`, light `#f3f5f7` / `#ffffff`, alert `#b42318`.

## Prerequisites

- Node.js 18+
- MongoDB 7 running locally **or** Docker
- Expo Go on an Android phone (Play Store version supports **SDK 54**), or an Android emulator

## 1. Start MongoDB

**Docker (from repo root):**

```bash
docker compose up -d
```

**Local MongoDB:** keep the default URI `mongodb://127.0.0.1:27017/tasheel_elevator`.

If you do not have Docker, install [MongoDB Community](https://www.mongodb.com/try/download/community) or create a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster and put the connection string in `backend/.env` as `MONGO_URI`.

## 2. Run the Express API

```bash
cd backend
copy .env.example .env
npm install
npm run seed
npm run dev
```

API listens on `http://0.0.0.0:4000`.

Health check: `GET http://localhost:4000/health`

### Demo logins (password `Demo123!`)

| Role | Email |
|---|---|
| Admin / Dispatcher | `admin@tasheel.om` |
| Customer (ONEIC) | `fatima@oneic.om` |
| Customer (ABC Tower) | `ops@abctower.om` |
| Technician Ahmed K. | `ahmed.k@tasheel.om` |
| Technician Salim A. | `salim.a@tasheel.om` |

Seeded lifts include **EL-001** (ABC Tower), **EL-002** (ONEIC HQ), **EL-018** (City Centre Qurum, active emergency), plus EL-007 / EL-011 / EL-021.

## 3. Run the Expo Android app

```bash
cd mobile
npm install
npx expo start
```

Then press `a` for the Android emulator, or scan the QR code with **Expo Go**.

The app resolves the API host from Expo’s LAN address (`hostUri`) and calls port `4000`. Keep the phone/emulator on the same Wi-Fi as the PC.

Override if needed:

```bash
# Windows PowerShell
$env:EXPO_PUBLIC_API_URL="http://192.168.1.10:4000"
npx expo start
```

Use `http://10.0.2.2:4000` only for the **Android Virtual Device** (AVD) emulator. Physical devices must use your PC’s LAN IP.

If login fails with “Cannot reach API”, allow Node.js through Windows Firewall on port 4000.

## API map

| Resource | Routes |
|---|---|
| Auth | `POST /api/auth/login`, `GET /api/auth/me`, `GET /api/auth/technicians` |
| Elevators | `GET/POST /api/elevators`, `GET /api/elevators/stats`, `GET/PATCH/DELETE /api/elevators/:id`, telemetry sub-routes |
| Faults | `GET/POST /api/faults`, assign + status |
| Emergencies | `GET /api/emergencies`, `GET /api/emergencies/active`, SOS create, assign, status |
| Maintenance | `GET/POST /api/maintenance`, start, checklist, sign-off, stats |

All routes except login require `Authorization: Bearer <jwt>`. RBAC: admin (full), customer (own fleet + SOS/faults), technician (assigned jobs).

## Mobile structure

```
mobile/src
  screens/          Home (role-aware), Elevators, Emergency, Maintenance, Profile, telemetry & checklist
  components/       HealthScoreCircle, ElevatorCard, EmergencyBanner, MaintenanceChecklist, modals
  navigation/       Bottom tabs + native stack
  context/          Auth, i18n (en/ar + I18nManager RTL), toasts
  theme/            Dark / light industrial tokens
  services/         Axios client + TypeScript models
```

Switch **English / Arabic** and **dark / light** from the Profile tab. Arabic forces RTL; a reload is required for a full layout flip.

## Project layout

```
backend/     Express MVC API
mobile/       Expo app
docker-compose.yml
```

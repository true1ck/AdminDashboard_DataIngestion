# Goal Description
The objective is to disconnect the NetaBoard React application from the hard-coded `src/data/index.ts` file and connect it to the new live Node.js/Express backend and PostgreSQL database. This allows the application to display dynamic data fetched via API requests.

## Proposed Changes

### 1. Backend API Layer (`backend/src`)
We will expand the Express server to serve the core data entities originally found in `src/data/index.ts`.

#### [MODIFY] [backend/src/index.ts](file:///Users/sandeepkumar/Projects/NetaBoardV5/backend/src/index.ts)
- Add endpoints to query Prisma:
  - `GET /api/feedback`
  - `GET /api/social`
  - `GET /api/alerts`
  - `GET /api/channels`

---

### 2. Frontend Data Fetching (`src/api`)
We need a centralized place to orchestrate API calls to the locally running backend.

#### [NEW] [src/api/client.ts](file:///Users/sandeepkumar/Projects/NetaBoardV5/src/api/client.ts)
- Create helper functions (`fetchArchetypes`, `fetchFeedback`, etc.) to interface with `http://localhost:3000/api`.

---

### 3. Frontend Global State Management (`src/context`)
To avoid prop drilling and mass component rewrites, we will use React Context to fetch the backend data once on load and distribute it.

#### [NEW] [src/context/DataContext.tsx](file:///Users/sandeepkumar/Projects/NetaBoardV5/src/context/DataContext.tsx)
- Create a `DataProvider` component that uses `useEffect` to call `api/client.ts`.
- Expose a `useNetaData()` hook that returns `{ arc, feedback, social, alerts, channels, isLoading }`.

---

### 4. Updating React Components (`src/components` & `App.tsx`)
We must replace the static imports with dynamic context consumption.

#### [MODIFY] [src/App.tsx](file:///Users/sandeepkumar/Projects/NetaBoardV5/src/App.tsx)
- Wrap the main application tree in `<DataProvider>`.
- Handle the global `isLoading` state (show a spinner while data is being fetched from the backend).

#### [MODIFY] [src/components/ContentRouter.tsx](file:///Users/sandeepkumar/Projects/NetaBoardV5/src/components/ContentRouter.tsx)
- Remove `import { ARC, FEEDBACK... } from '../data'`.
- Add `const { arc, feedback, social, alerts, channels } = useNetaData()`.
- Ensure components render flawlessly using the identical format returned by the backend.

#### [MODIFY] [src/components/layout/Sidebar.tsx](file:///Users/sandeepkumar/Projects/NetaBoardV5/src/components/layout/Sidebar.tsx)
- Use Context to access live `alerts` data for notification counts.

#### [MODIFY] [src/components/layout/Topbar.tsx](file:///Users/sandeepkumar/Projects/NetaBoardV5/src/components/layout/Topbar.tsx)
- Use Context to access live `alerts` data for notifications dropdown.

## Verification Plan

### Automated Tests
- Run the Express server in the background: `cd backend && npm run dev`
- Ensure the frontend builds without type errors: `npm run build`

### Manual Verification
- Start the React app (`npm run dev`).
- Open the application. Wait for the initial loading spinner to disappear.
- Click across all pillars, the Jan Darbar feedback section, and the Social Inbox to visually verify that data from the PostgreSQL database is being rendered identically to the original static layout.

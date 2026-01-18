# SHH Ticket System (Demo)

Demo-only request management dashboard built with Next.js. This version runs
entirely in the browser using localStorage (no backend), designed for portfolio
and live demos.

## Features
- Multi-role dashboard: applicant, approver, lead, media A/B/C.
- Ticket lifecycle: submit, approve/return, assign, status updates.
- Rich detail view with size fields and description truncation/expand.
- Search, filter, sort, and CSV export (lead role).
- Responsive layouts for desktop and mobile.

## Tech Stack
- Next.js (App Router) + TypeScript
- LocalStorage for demo persistence
- Custom CSS (no UI framework)

## Getting Started
```bash
npm install
npm run dev
```
Open http://localhost:3000

## Demo Data
Demo tickets are loaded from localStorage on first run and then persisted.
To reset demo data, clear the `reqsysTickets` key in localStorage.

## Roles
Role switching is built in for demo purposes:
- applicant / applicant-int
- approver / approver-int
- lead
- media-a / media-b / media-c

## Notes
This project is a static demo. It does not require a backend and does not
connect to a database. All changes are stored in the current browser only.

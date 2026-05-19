# Clean Scheduler - House Cleaning Management App

A complete scheduling and invoicing application for house cleaning companies that service short-term rental properties.

## Features

- **Dashboard**: Overview of key metrics (houses, cleaners, pending jobs, revenue)
- **Property Owners**: Manage property owner contact information
- **Houses**: Manage rental properties with cost profiles and dog allowances
- **Cost Profiles**: Define base pricing and dog surcharges
- **Cleaners**: Manage cleaning staff
- **Bookings**: Track guest bookings with check-in/check-out times
- **Cleaning Jobs**: Schedule and track cleaning jobs (auto-scheduled after bookings)
- **Invoices**: Generate PDF invoices for completed cleaning jobs

## Tech Stack

- **Frontend**: Svelte 5 (with runes)
- **Backend**: Node.js + Express
- **Database**: SQLite3 (better-sqlite3)
- **PDF Generation**: pdfkit

## Getting Started

### Installation

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

This starts both the backend API server (port 3001) and the Vite frontend (port 5173).

## Usage Workflow

1. **Setup**: Add owners, cost profiles, cleaners, and houses
2. **Bookings**: Create a booking for a house (check-in/check-out dates)
3. **Auto-Scheduling**: A cleaning job is automatically created 2 hours after checkout
4. **Cleaning**: Update job status as cleaner progresses (pending → scheduled → in_progress → completed)
5. **Invoicing**: Once completed, generate a PDF invoice sent to the property owner

## API Endpoints

All endpoints are available at `http://localhost:3001/api`

- `/owners` - Property owners CRUD
- `/cost-profiles` - Pricing profiles CRUD
- `/cleaners` - Cleaners CRUD
- `/houses` - Houses CRUD
- `/bookings` - Guest bookings CRUD
- `/cleaning-jobs` - Cleaning jobs CRUD
- `/invoices` - Invoices and PDF generation
- `/dashboard/stats` - Dashboard statistics

## Database Schema

- **owners**: Property owner information
- **cost_profiles**: Base price and dog surcharge definitions
- **houses**: Properties linked to owners and cost profiles
- **cleaners**: Cleaning staff
- **bookings**: Guest reservations with check-in/out times
- **cleaning_jobs**: Scheduled cleaning tasks with costs
- **invoices**: Generated invoices with PDF paths

## Project Structure

```
/workspace
├── server/
│   ├── database.js      # SQLite setup and schema
│   ├── index.js         # Express API server
│   └── pdf-generator.js # PDF invoice generation
├── src/
│   ├── lib/
│   │   └── api.js       # Frontend API client
│   ├── routes/
│   │   ├── Dashboard.svelte
│   │   ├── Owners.svelte
│   │   ├── Houses.svelte
│   │   ├── CostProfiles.svelte
│   │   ├── CleaningJobs.svelte
│   │   └── Invoices.svelte
│   └── App.svelte       # Main app with navigation
└── package.json
```

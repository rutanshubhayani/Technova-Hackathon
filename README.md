# EV Smart Route & Charging Assistant

A comprehensive platform for EV users to plan trips, check battery range, and find verified charging stations.

## Features

- **Battery Range Calculator**: Calculate your EV's travel range based on current battery percentage
- **Smart Route Feasibility Check**: Check if you can reach your destination or if charging is required
- **Verified Charging Station Directory**: View only owner-managed and verified charging stations
- **Owner-Based Station Management**: Verified owners can add, update, or delete their station entries
- **Admin Dashboard**: Admins can verify owners and monitor the platform

## Technology Stack

- **Frontend**: React, HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **Database**: SQLite

## Installation

1. Install all dependencies:
```bash
npm run install-all
```

2. Set up environment variables:
```bash
cd backend
cp .env.example .env
# Edit .env and set your JWT_SECRET
```

3. Start the development servers:
```bash
npm run dev
```

This will start:
- Backend server on http://localhost:5000
- Frontend React app on http://localhost:3000

## Default Admin Credentials

- Username: `admin`
- Email: `admin@evassistant.com`
- Password: `admin123`

**Note**: Change these credentials in production!

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Calculator
- `POST /api/calculator/range` - Calculate battery range
- `POST /api/calculator/route-check` - Check route feasibility

### Stations
- `GET /api/stations` - Get all verified stations
- `GET /api/stations/:id` - Get station by ID
- `POST /api/stations` - Create station (owner/admin only)
- `PUT /api/stations/:id` - Update station (owner/admin only)
- `DELETE /api/stations/:id` - Delete station (owner/admin only)
- `GET /api/stations/owner/my-stations` - Get owner's stations

### India Charging Stations
- `GET /api/india-stations` - Get all India network charging stations
- `GET /api/india-stations/:id` - Get India station by ID
- `GET /api/india-stations/search/location?lat=&lng=&radius=` - Search stations by location
- `GET /api/india-stations/stats/summary` - Get India stations statistics

### Admin
- `GET /api/admin/owners` - Get all owners
- `POST /api/admin/owners/:id/verify` - Verify owner
- `GET /api/admin/stations` - Get all stations
- `POST /api/admin/stations/:id/verify` - Verify station
- `GET /api/admin/stats` - Get dashboard statistics

## User Roles

- **User**: Can view stations and use calculators
- **Owner**: Can manage their own stations (requires admin verification)
- **Admin**: Can verify owners and stations, monitor platform

## Project Structure

```
EV-smart assistance/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── calculator.js
│   │   ├── stations.js
│   │   └── admin.js
│   ├── data/
│   │   └── ev_assistant.db (auto-generated)
│   └── server.js
├── frontend/
│   └── (React app files)
└── package.json
```


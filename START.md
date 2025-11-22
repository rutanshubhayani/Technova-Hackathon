# How to Start the Application

## Quick Start

1. **Install all dependencies** (if not already done):
   ```bash
   npm run install-all
   ```

2. **Set up environment variables** (optional):
   - The backend will use default values if `.env` is not present
   - To customize, create `backend/.env` with:
     ```
     PORT=5000
     JWT_SECRET=your-secret-key-here
     ```

3. **Start both servers**:
   ```bash
   npm run dev
   ```
   
   This will start:
   - Backend server on http://localhost:5000
   - Frontend React app on http://localhost:3000

## Alternative: Start Servers Separately

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

## Default Admin Credentials

- **Email:** admin@evassistant.com
- **Password:** admin123

## First Steps

1. Open http://localhost:3000 in your browser
2. Login as admin to access the admin dashboard
3. Register as an owner to add charging stations (requires admin verification)
4. Use the calculators to check battery range and route feasibility
5. Browse verified charging stations

## Troubleshooting

- If the backend fails to start, make sure port 5000 is available
- If the frontend fails to start, make sure port 3000 is available
- The database will be automatically created in `backend/data/ev_assistant.db`
- Check console logs for any errors


# Quick Start Guide - Running the Full Project

This guide will help you run both the frontend and backend together.

## Prerequisites

✅ Node.js >= 14.x installed  
✅ PostgreSQL >= 12 installed and running  
✅ Database `stock_erp` created

## Step-by-Step Instructions

### 1️⃣ Set Up Backend

Open **Terminal 1**:

```bash
# Navigate to backend
cd backend

# Install dependencies (first time only)
npm install

# Configure environment
copy .env.example .env

# Edit .env file with your database credentials:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=stock_erp
# DB_USER=postgres
# DB_PASSWORD=your_password

# Create database in PostgreSQL:
# CREATE DATABASE stock_erp;

# Run migrations and seed data
npm run setup

# Start backend server
npm start
```

✅ Backend should now be running on `http://localhost:8000`

### 2️⃣ Set Up Frontend

Open **Terminal 2** (new terminal):

```bash
# Navigate to frontend
cd frontend

# Install dependencies (first time only)
npm install

# Start frontend development server
npm run dev
```

✅ Frontend should now be running on `http://localhost:8080`

### 3️⃣ Access the Application

Open your browser and visit: **http://localhost:8080**

## Troubleshooting

### Backend Issues

**Database connection error:**
- Make sure PostgreSQL is running
- Check `.env` file has correct credentials
- Verify database `stock_erp` exists

**Port already in use:**
- Change `PORT=8000` to a different port in `.env`
- Update frontend API URL accordingly

### Frontend Issues

**Port already in use:**
- Vite will automatically try the next available port
- Check the terminal output for the actual port

**Cannot connect to API:**
- Make sure backend is running
- Check backend URL in frontend code/config (if configured)
- Verify CORS settings in backend `.env` match frontend URL

## Development Tips

### Auto-reload Backend
```bash
npm run dev
```
This uses nodemon to auto-restart the server when files change.

### Check Backend Health
Visit: `http://localhost:8000/health`

### Check API Root
Visit: `http://localhost:8000/`

## Next Steps

1. ✅ Both servers running
2. ✅ Frontend accessible at http://localhost:8080
3. ✅ Start using the application!

For more details, see:
- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)


# Stock ERP Frontend

React + TypeScript frontend application for Stock ERP system.

## Prerequisites

- Node.js >= 14.x
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment (optional):
```bash
copy .env.example .env
```

Update `.env` if your backend runs on a different URL:
```env
VITE_API_URL=http://localhost:8000/api
```

3. Start development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:8080`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Backend Integration

The frontend connects to the backend API at the URL specified in `.env` (default: `http://localhost:8000/api`).

Make sure the backend is running before starting the frontend.

## Features

- ✅ Real-time data from backend API
- ✅ CRUD operations for all entities
- ✅ Error handling and loading states
- ✅ Responsive design
- ✅ Modern UI with shadcn/ui components

## Project Structure

```
src/
├── components/        # React components
│   ├── layout/       # Layout components
│   ├── modals/       # Modal dialogs
│   └── ui/           # UI components (shadcn/ui)
├── contexts/         # React contexts (StockContext)
├── hooks/            # Custom React hooks
├── lib/              # Utilities and API client
├── pages/            # Page components
└── App.tsx           # Main app component
```

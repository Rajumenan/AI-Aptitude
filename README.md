# AI Aptitude Quiz Platform 🎓

A complete, enterprise-level, production-ready full-stack AI-Powered Aptitude Quiz Platform built with **React Native (pure CLI)**, **Node.js (Express)**, **MongoDB**, and **Google Gemini AI**.

---

## Folder Structure

```
d:\A app\
├── backend/
│   ├── config/             # DB & server configurations
│   ├── controllers/        # Express handlers (Auth, Quiz, Profile, etc.)
│   ├── middleware/         # Security rate limiters, JWT verifiers
│   ├── models/             # Mongoose MongoDB schemas
│   ├── routes/             # Express API routing tables
│   ├── services/           # AI Service integration (Google Gemini)
│   ├── utils/              # Helper utilities (OTP, token handshakes)
│   ├── .env.example        # Configuration template
│   ├── package.json        # Dependencies list
│   └── server.js           # Express main server entry point
├── frontend/
│   ├── android/            # Native Android project directory
│   ├── ios/                # Native iOS project directory
│   ├── assets/             # Assets (images, fonts, custom icons)
│   ├── src/
│   │   ├── components/     # Reusable UI elements (Buttons, Loaders, Layouts)
│   │   ├── context/        # React context (Theme toggling, Auth state tracking)
│   │   ├── navigation/     # Tab and Stack routing configurations
│   │   ├── screens/        # Frontend UI pages (Splash, Dashboard, Quiz, Results)
│   │   └── services/       # Fetch wrapper with interceptors (api.js)
│   ├── app.json            # Product identity definitions
│   ├── App.jsx             # React Native application root
│   ├── babel.config.js     # Transpiler configs
│   ├── index.js            # AppRegistry entry loader
│   ├── metro.config.js     # Metro packager rules
│   └── package.json        # Frontend packages list
└── README.md               # User manual & guides (this file)
```

---

## Database Design (MongoDB Schema)

The database utilizes Mongoose schemas to represent collections:

### 1. `Users`
- Stores user credentials, email validation status (`isVerified`), and OAuth/Refresh keys (`refreshToken`).
- Passwords are encrypted on-save using a `bcryptjs` pre-hook (10 rounds).

### 2. `QuizSessions`
- Tracks the real-time state of a user's quiz.
- Contains the 10 AI-generated questions (including choices, correct options, and detailed step-by-step explanations) and user answers to prevent cheating and support active session resumption.

### 3. `Results`
- Stores final scorecards on quiz completion.
- Links the AI-generated performance report detailing topic strengths, weaknesses, and next-step difficulty suggestions.

### 4. `Leaderboards`
- Groups entries per level. Maintains sorted entries representing the top 10 fastest times and highest scores.

### 5. `Certificates`
- Stores achievement certifications awarded to users scoring `70%` or higher. Links a unique verification UUID.

### 6. `Notifications`
- Feeds user-specific alerts such as new badge achievements or system announcements.

### 7. `Settings`
- Persists user preferences like Dark Mode and Push Notification toggles.

---

## REST API Documentation

All endpoints (except signup/login/verify-otp) are protected via JWT authorization headers (`Authorization: Bearer <access_token>`).

### 1. Authentication (`/api/auth`)
- `POST /register`: Registers user. Generates & logs 6-digit verification OTP.
- `POST /verify-otp`: Confirms OTP matching to verify email. Returns Access & Refresh tokens.
- `POST /login`: Validates password. Returns tokens.
- `POST /refresh-token`: Rotates expired access tokens using the refresh token.
- `POST /forgot-password`: Requests a reset OTP.
- `POST /reset-password`: Resets credentials if a valid reset OTP is supplied.
- `POST /logout`: Invalidates the session.

### 2. Quiz Orchestration (`/api/quiz`)
- `POST /start`: Initiates a new 10-question quiz. Generates Q1.
- `GET /current-question`: Returns the current question details (hides correct options to prevent cheating).
- `POST /submit-answer`: Submits a choice. Returns whether it is correct/incorrect, the score, and generates the next question. If Q10 is submitted, calculates final score and triggers AI performance analysis.
- `GET /session-state`: Verifies if the user has an active quiz in progress for resumption.

### 3. Scorecards & Review (`/api/results`)
- `GET /history`: Returns a list of past scores.
- `GET /details/:sessionId`: Fetches the scorecard, AI strengths/weaknesses feedback, and full question-by-question review with explanations.
- `GET /certificate/:sessionId`: Retrieves certificate details.

### 4. Leaderboard (`/api/leaderboard`)
- `GET /:level`: Pulls the top 10 users ranked by highest score and fastest time for a level.

### 5. Profile & Settings (`/api/profile`)
- `GET /me`: Returns profile summary, settings, and aggregate statistics.
- `PUT /settings`: Updates user UI/alert settings (such as dark mode toggle).

---

## AI Agent Integration (Google Gemini)

The system integrates Google Gemini AI (`gemini-2.5-flash` model) using the `@google/generative-ai` SDK:

1. **Intelligent Question Generation**:
   - Generates multiple-choice questions matching levels (`Basic`, `Intermediate`, `Advance`, `Company Related`, `Government Exams`).
   - Receives previously asked questions to guarantee uniqueness.
   - Provides a detailed step-by-step mathematical explanation.
2. **Cognitive Performance Analysis**:
   - Reviews the student's correctness across topics.
   - Highlights strong topics and weak areas of improvement.
   - Recommends actionable study topics and the next quiz level.

*Note: If the `GEMINI_API_KEY` is missing or the server is offline, the backend automatically falls back to a curated local database of aptitude questions and rule-based feedback, ensuring the app never crashes in production.*

---

## Installation & Setup Guide

### Prerequisites
- **Node.js** (v18+) & **npm** (v9+)
- **MongoDB** running locally (`mongodb://localhost:27017`) or a MongoDB Atlas URI.

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment template to `.env`:
   ```bash
   cp .env.example .env
   ```
4. Fill in `.env` configurations:
   - Provide your `MONGO_URI` (default is local MongoDB).
   - Enter your `GEMINI_API_KEY` from Google AI Studio.
5. Launch the backend API:
   ```bash
   # Development mode with watch triggers
   npm run dev
   ```

### 2. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the Vite local dev server:
   ```bash
   npm start
   ```
4. Open the link in your browser:
   - Open `http://localhost:5173` to interact with the platform dashboard!

---

## Production Deployment Checklist

1. **MongoDB Integration**: Set up a MongoDB Atlas cluster and use the connection string as `MONGO_URI`.
2. **Secrets & Security**: Ensure `JWT_SECRET` and `JWT_REFRESH_SECRET` are long, random keys. Configure rate limiters correctly to prevent DDoS attempts.
3. **Environment Injection**: Set `NODE_ENV=production` on host providers (e.g. AWS EC2, Heroku, Render).
4. **Vite Production Compilation**: Use `npm run build` inside the `frontend/` directory to generate the optimized, static compilation assets under the `dist/` folder, ready to be hosted on Netlify, Vercel, or AWS S3.

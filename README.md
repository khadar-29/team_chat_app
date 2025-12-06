# 🚀 Team Chat Application (Slack-like)

A complete full-stack real-time chat application built for the **Full-Stack Internship Assignment**. Supports multiple users chatting simultaneously across channels with real-time messaging, presence tracking, and message history.

[![Demo](https://img.shields.io/badge/Live_Demo-Coming_Soon-blue)](https://your-app.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Running-green)](http://localhost:5000)

## 🎯 Features Implemented (Core Requirements ✅)

### User Authentication
- ✅ JWT-based signup/login/logout
- ✅ Persistent sessions (localStorage)
- ✅ Protected routes (dashboard requires login)

### Channels System
- ✅ View all existing channels
- ✅ Create new channels (`#general`, `#random`, etc.)
- ✅ Join/leave channels (membership persists until explicit leave)
- ✅ Channel info: name, member count, creator

### Real-Time Messaging
- ✅ Instant messages across all tabs/users in same channel
- ✅ WebSocket (Socket.io) implementation
- ✅ Messages stored in MongoDB with sender, channel, content, timestamp

### Online Presence
- ✅ Real-time online/offline status (green dots)
- ✅ Shows "who is online" in each channel header
- ✅ Works across multiple browser tabs

### Message History & Pagination
- ✅ Load recent 20 messages on channel open
- ✅ Infinite scroll loads older messages
- ✅ Smooth auto-scroll to bottom on new messages

### UI/UX
- ✅ Responsive design (TailwindCSS)
- ✅ Blue/white theme matching assignment
- ✅ Loading states, empty states, error handling

## 🛠️ Tech Stack

Frontend:
├── React 18 (Create React App)
├── TailwindCSS 3.x
├── Socket.io-client
├── React Router
├── React Context (Auth)
└── Axios (API calls)

Backend:
├── Node.js / Express.js
├── Socket.io
├── MongoDB (Mongoose ODM)
├── JWT (jsonwebtoken)
├── bcryptjs (password hashing)
├── CORS enabled
└── Nodemon (development)

Database:
└── MongoDB (local or MongoDB Atlas)


## 🚀 Setup & Run Instructions

### Prerequisites
Node.js 18+
npm/yarn
MongoDB (local or Atlas)

text

### 1. Clone & Install Backend
git clone <your-repo>
cd backend
cp .env.example .env
npm install
npm run dev
text
**Backend runs on `http://localhost:5000`**

### 2. Install & Run Frontend
cd frontend
npm install
npm start

**Frontend runs on `http://localhost:3000`**

### 3. Environment Variables (backend/.env)
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/teamchat
JWT_SECRET=your-super-secret-jwt-key-here

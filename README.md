# 🧘 Serenity AI

**Serenity AI** is a comprehensive mental wellness platform that combines AI-powered therapy, mood tracking, and personalized activities to support mental health and well-being.

## 🌟 Features

- **AI Therapy Chat**: Engage in supportive conversations with an AI therapist
- **Mood Tracking**: Log and monitor your emotional state over time
- **Activity Logging**: Track therapeutic activities and their impact
- **Personalized Insights**: Get AI-generated insights based on your patterns
- **Stress Detection**: Automatic stress signal detection with activity recommendations
- **Therapeutic Activities**: Guided breathing exercises, meditation, and more

## 🏗️ Architecture

This is a full-stack application with:

- **Frontend**: Next.js 16 + React 19 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript + MongoDB
- **AI**: Google Gemini API
- **Background Jobs**: Inngest
- **Authentication**: NextAuth + JWT

## 📁 Project Structure

```
serenity/
├── client/                 # Frontend (Next.js)
│   ├── src/
│   │   ├── app/           # Next.js app directory
│   │   ├── components/    # React components
│   │   └── lib/           # Utilities and helpers
│   ├── public/            # Static assets
│   └── package.json
│
├── server/                # Backend (Express)
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── models/        # MongoDB models
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Express middleware
│   │   ├── inngest/       # Background jobs
│   │   └── utils/         # Utilities
│   └── package.json
│
├── DEPLOYMENT_GUIDE.md    # Detailed deployment instructions
├── DEPLOYMENT_CHECKLIST.md # Quick deployment checklist
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account
- Google Gemini API key
- Inngest account

### Local Development

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/serenity.git
   cd serenity
   ```

2. **Set up the backend**

   ```bash
   cd server
   npm install
   cp .env.example .env
   # Edit .env and add your environment variables
   npm run dev
   ```

3. **Set up the frontend** (in a new terminal)

   ```bash
   cd client
   npm install
   cp .env.example .env.local
   # Edit .env.local and add your environment variables
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

## 🌐 Deployment

For detailed deployment instructions, see:

- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Complete step-by-step guide
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Quick reference checklist

### Quick Deployment Summary

**Backend (Render)**

1. Create Web Service on Render
2. Connect GitHub repository
3. Set root directory to `server`
4. Configure environment variables
5. Deploy

**Frontend (Vercel)**

1. Import project on Vercel
2. Set root directory to `client`
3. Configure environment variables
4. Deploy

## 🔑 Environment Variables

### Backend (.env)

```env
MONGODB_URI=your_mongodb_connection_string
PORT=3001
NODE_ENV=production
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key
```

### Frontend (.env.local)

```env
BACKEND_API_URL=http://localhost:3001
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Activity Endpoints

- `POST /api/activity` - Log new activity
- `GET /api/activity/today` - Get today's activities
- `GET /api/activity/history` - Get activity history

### Mood Endpoints

- `POST /api/mood` - Log mood
- `GET /api/mood/history` - Get mood history

### Chat Endpoints

- `POST /api/chat/sessions` - Create chat session
- `GET /api/chat/sessions` - Get all sessions
- `GET /api/chat/sessions/:id` - Get session details
- `POST /api/chat/sessions/:id/messages` - Send message
- `DELETE /api/chat/sessions/:id` - Delete session

## 🛠️ Tech Stack

### Frontend

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **Animations**: Framer Motion
- **UI Components**: Radix UI
- **State Management**: React Hooks
- **Authentication**: NextAuth

### Backend

- **Runtime**: Node.js
- **Framework**: Express 5
- **Language**: TypeScript
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT
- **Background Jobs**: Inngest
- **AI**: Google Gemini
- **Security**: Helmet, CORS

## 🧪 Testing

```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test
```

## 📊 Monitoring

- **Backend Logs**: Available in Render dashboard
- **Frontend Logs**: Available in Vercel dashboard
- **Database**: Monitor in MongoDB Atlas
- **Background Jobs**: Monitor in Inngest dashboard

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 🙏 Acknowledgments

- Google Gemini for AI capabilities
- Inngest for background job processing
- MongoDB Atlas for database hosting
- Vercel for frontend hosting
- Render for backend hosting

## 📞 Support

For issues and questions:

- Open an issue on GitHub
- Check the [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for deployment help

## 🔄 Version History

- **v1.0.0** - Initial release
  - AI therapy chat
  - Mood tracking
  - Activity logging
  - User authentication

---

**Built with ❤️ for mental wellness**

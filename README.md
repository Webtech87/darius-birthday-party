# 🎉 Darius Birthday Party RSVP App

A full-stack birthday party RSVP application built with **React frontend** and **Python Flask backend**.

## 📁 Project Structure

```
darius-birthday-party/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/
│   │   └── ...
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
├── server/                 # Flask backend
│   ├── app/
│   │   ├── models/
│   │   ├── routes/
│   │   └── __init__.py
│   ├── app.py
│   ├── requirements.txt
│   └── .env
├── package.json           # Root package.json for development
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8+ 
- Node.js (v18 or higher)
- npm or yarn

### Installation & Setup

1. **Backend Setup:**
   ```bash
   cd server
   
   # Activate virtual environment
   source venv/bin/activate  # Mac/Linux
   # OR
   venv\Scripts\activate     # Windows
   
   # Install Python dependencies (already done by setup script)
   pip install -r requirements.txt
   ```

2. **Frontend Setup:**
   ```bash
   cd client
   npm install
   ```

3. **Start Development Servers:**
   ```bash
   # From root directory
   npm run dev
   ```

This will start:
- Flask backend on `http://localhost:5000`
- React frontend on `http://localhost:5173`

## 🛠️ Backend API (Flask)

### Party Endpoints
- `GET /api/party` - Get party details
- `PUT /api/party` - Update party details (admin)
- `GET /api/party/stats` - Get party statistics

### RSVP Endpoints
- `POST /api/rsvp` - Submit new RSVP
- `GET /api/rsvp/<confirmation_code>` - Get RSVP details
- `PUT /api/rsvp/<confirmation_code>` - Update existing RSVP
- `DELETE /api/rsvp/<confirmation_code>` - Cancel RSVP

### Guest Endpoints
- `GET /api/guests` - Get all guests (admin)
- `GET /api/guests/public` - Get public guest list
- `GET /api/guests/search` - Search guests
- `GET /api/guests/stats` - Get guest statistics

## 🗄️ Database Models

### Party Model (SQLAlchemy)
- Party details (date, time, location)
- Settings (max guests, RSVP deadline)
- Contact information

### RSVP Model (SQLAlchemy)
- Guest information
- Attendance status
- Dietary restrictions
- Plus-one details
- Confirmation code

## 🧪 Testing API Endpoints

```bash
# Health check
curl http://localhost:5000/api/health

# Get party details
curl http://localhost:5000/api/party

# Submit RSVP
curl -X POST http://localhost:5000/api/rsvp \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","attending":"yes","number_of_guests":1}'
```

## 🔧 Environment Variables

Edit `server/.env`:
```bash
FLASK_APP=app.py
FLASK_ENV=development
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///birthday_party.db
CLIENT_URL=http://localhost:5173
```

## 🚢 Deployment

### Flask Backend
```bash
cd server
python app.py
```

### React Frontend
```bash
cd client
npm run build
npm run preview
```

## 📱 Features

- ✅ Complete RSVP system
- ✅ SQLite database (easily upgradeable to PostgreSQL)
- ✅ Input validation and error handling
- ✅ CORS configured for frontend
- ✅ Confirmation codes for RSVP management
- ✅ Guest capacity management
- ✅ Statistics and reporting
- ✅ Search functionality

## 🎯 Next Steps

1. Update your React components to use the Flask API endpoints
2. Style your frontend components
3. Add admin authentication (optional)
4. Deploy to production

Enjoy your birthday party! 🎂

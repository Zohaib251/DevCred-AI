# DevCred AI

**Authenticate Your Resume. Validate Your Projects. Prove Your Credentials.**

DevCred AI is a full-stack web application that analyzes resumes using advanced AI and validates project claims against actual GitHub repositories. Built with modern web technologies, it leverages Google Gemini AI to extract candidate information, detect technical skills, and verify project authenticity without false positives or data congestion.

---

## 🌟 Features

✨ **Resume Parsing**
- PDF and DOCX file support
- Intelligent text extraction using pypdf and python-docx
- Extracts candidate names and technical skills automatically

🤖 **AI-Powered Analysis**
- Google Gemini AI integration for intelligent resume analysis
- Structured JSON output with guaranteed schema validation
- Expert technical recruiter persona for accurate skill detection

🔗 **GitHub Integration**
- Live GitHub API integration for real-time repository metadata
- Automatic project validation against actual repositories
- Cross-reference matching between resume claims and code reality

✅ **Project Verification**
- Three-tier verification system: "Verified", "Tutorial Clone", "Unverified"
- Detects tutorial clones and boilerplate patterns
- Provides confidence reasoning for every validation

🎨 **Modern UI/UX**
- Premium dark mode dashboard built with Tailwind CSS v4
- Responsive design optimized for desktop and tablet
- Real-time result display with gradient accents

---

## 🛠 Technology Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **HTTP Client**: Fetch API

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **Server**: Uvicorn
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **ORM**: SQLModel (SQLAlchemy)
- **AI/ML**: Google Gemini API
- **GitHub Integration**: GitHub REST API v3 (via httpx)
- **Document Parsing**: pypdf, python-docx
- **Cache**: In-memory mock or Redis

### DevOps & Deployment
- **Frontend Hosting**: Vercel or Netlify
- **Backend Hosting**: Render or Railway
- **Version Control**: Git & GitHub
- **Environment Management**: python-dotenv

---

## 📋 System Overview

### Data Flow

```
1. User uploads resume (PDF/DOCX)
   ↓
2. Backend parses file → extracts raw text
   ↓
3. Backend fetches user's GitHub repositories (if username provided)
   ↓
4. Gemini AI analyzes resume + GitHub metadata
   ↓
5. AI extracts: candidate name, skills, projects, verification status
   ↓
6. Results returned to frontend and displayed
```

### Architecture

The application follows a client-server architecture:

- **Frontend**: Single-page React application with responsive design
- **Backend**: RESTful FastAPI service with async request handling
- **Communication**: HTTP/REST with JSON payloads
- **AI Layer**: Google Gemini API for intelligent analysis
- **Data Layer**: SQLite database with SQLModel ORM

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (for frontend)
- Python 3.10+ (for backend)
- Git
- GitHub account (for API token)
- Google Gemini API key

### Installation

#### 1. Clone Repository
```bash
git clone <repository-url>
cd "Local Work/GitVibe AI"
```

#### 2. Backend Setup
```bash
cd gitvibe-backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.\.venv\Scripts\Activate.ps1
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
GITHUB_TOKEN=your_github_token_here
GEMINI_API_KEY=your_gemini_api_key_here
JWT_SECRET_KEY=your_secret_key_here
REDIS_URL=mock
DATABASE_URL=sqlite:///./gitvibe.db
BACKEND_PORT=8000
EOF

# Start backend server
python main.py
```

Backend runs on: `http://127.0.0.1:8000`

#### 3. Frontend Setup
```bash
cd gitvibe-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs on: `http://localhost:5173`

#### 4. Test the Application
- Open http://localhost:5173 in your browser
- Upload a resume (PDF or DOCX)
- Optionally enter a GitHub username
- Click "Analyze Resume"
- View results in the analysis panel

---

## 📁 Project Structure

```
GitVibe AI/
├── gitvibe-backend/
│   ├── main.py                 # FastAPI application entry point
│   ├── ai_service.py           # Gemini AI integration & resume analysis
│   ├── github_service.py        # GitHub API wrapper for repo fetching
│   ├── parsers.py              # PDF & DOCX parsing utilities
│   ├── requirements.txt         # Python dependencies
│   ├── .env                    # Environment variables (git-ignored)
│   ├── test_data/              # Sample resume files for testing
│   │   ├── sample_resume.pdf
│   │   └── sample_resume.docx
│   └── .venv/                  # Virtual environment (git-ignored)
│
├── gitvibe-frontend/
│   ├── index.html              # HTML entry point
│   ├── package.json            # Node.js dependencies
│   ├── tailwind.config.js       # Tailwind CSS configuration
│   ├── postcss.config.js        # PostCSS configuration
│   ├── vite.config.ts           # Vite build configuration
│   ├── src/
│   │   ├── main.tsx            # React app entry point
│   │   ├── App.tsx             # Main dashboard component
│   │   ├── index.css           # Global styles with Tailwind v4
│   │   └── App.css             # Component-specific styles
│   ├── node_modules/           # Dependencies (git-ignored)
│   └── dist/                   # Production build output
│
├── README.md                    # This file
├── deploy.txt                   # Production deployment guide
├── report.txt                   # Architectural documentation
├── requirements.txt             # Python dependencies (root)
├── .gitignore                   # Git ignore configuration
└── instructions.txt             # Initial setup checklist
```

---

## 🔐 Environment Variables

### Backend (.env file)

```bash
# GitHub Integration
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx

# Google Gemini AI
GEMINI_API_KEY=AIzaSyDxxxxxxxxxxxxxxx

# Security
JWT_SECRET_KEY=your-secure-random-string-min-32-chars

# Database
DATABASE_URL=sqlite:///./gitvibe.db

# Caching
REDIS_URL=mock

# Server
BACKEND_PORT=8000
```

### Frontend (Optional)

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

---

## 🧠 How It Works

### Resume Parsing

1. User uploads PDF or DOCX file
2. Backend uses pypdf or python-docx to extract text
3. Raw text is sanitized and prepared for AI analysis

### AI Analysis

1. Extracted resume text is sent to Google Gemini API
2. System prompt directs AI to act as technical recruiter
3. AI extracts:
   - Candidate name
   - Technical skills (programming languages, frameworks, tools)
   - Project names and descriptions
4. Structured JSON response validated against Pydantic schema

### GitHub Validation

1. If username provided, backend fetches public repositories via GitHub API
2. Repositories return: name, description, primary language
3. Gemini AI compares resume projects with GitHub repositories
4. AI assigns verification status:
   - **Verified**: Resume project correlates with actual GitHub repo
   - **Tutorial Clone**: Repository shows boilerplate/single-commit patterns
   - **Unverified**: No matching GitHub repo or insufficient correlation

### Data Safety

- ✅ Only public GitHub data is accessed
- ✅ No private repositories queried
- ✅ Resume text processed server-side only
- ✅ No persistent storage of extracted data
- ✅ API keys stored as environment variables, never in code

---

## 📊 API Endpoints

### Health Check
```
GET /health
Response: {"status": "healthy", "redis_mocked": true, "database": "sqlite"}
```

### Resume Parse & Analyze
```
POST /api/v1/resume/parse?github_username=optional_username
Multipart form-data: file (PDF or DOCX)

Response:
{
  "status": "success",
  "filename": "resume.pdf",
  "file_type": "PDF",
  "github_validation": {
    "status": "success|skipped",
    "username": "torvalds",
    "repositories_found": 42
  },
  "raw_text": "...",
  "analysis": {
    "candidate_name": "John Doe",
    "detected_skills": ["Python", "FastAPI", "React"],
    "extracted_projects": [
      {
        "project_name": "AI Resume Parser",
        "resume_description": "...",
        "matching_github_repo": "resume-parser",
        "verification_status": "Verified",
        "confidence_reasoning": "..."
      }
    ]
  }
}
```

---

## 🚀 Production Deployment

See `deploy.txt` for comprehensive production deployment instructions covering:
- Frontend deployment to Vercel/Netlify
- Backend deployment to Render/Railway
- Environment variable configuration
- Continuous deployment setup
- Monitoring and troubleshooting

---

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🆘 Support & Issues

For issues or questions:
1. Check existing GitHub issues
2. Create a new issue with detailed description
3. Include error messages and steps to reproduce

---

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Google Gemini API](https://ai.google.dev/)
- [GitHub REST API](https://docs.github.com/en/rest)

---

**Built with ❤️ for developers who want to authenticate their credentials.**

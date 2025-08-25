# Skill Management API

A comprehensive FastAPI backend for the Skill Management System with PostgreSQL database.

## Features

- **Authentication**: Google OAuth integration with JWT tokens
- **User Management**: User profiles, manager-subordinate relationships
- **Skill Management**: Create, read, update, delete skills and sub-skills
- **Approval Workflow**: Manager approval system for skill submissions
- **Skill Matching**: Advanced filtering and search capabilities

## Project Structure

```
backend/
├── main.py                 # FastAPI application entry point
├── database.py            # Database configuration and session management
├── requirements.txt       # Python dependencies
├── .env.example          # Environment variables template
├── alembic.ini           # Alembic configuration
├── models/               # SQLAlchemy models
│   ├── __init__.py
│   ├── user.py          # User model
│   └── skill.py         # Skill-related models
├── schemas/             # Pydantic schemas
│   ├── __init__.py
│   ├── user.py         # User schemas
│   └── skill.py        # Skill schemas
├── routes/             # API route handlers
│   ├── __init__.py
│   ├── auth.py        # Authentication endpoints
│   ├── users.py       # User management endpoints
│   ├── skills.py      # Skill management endpoints
│   └── approvals.py   # Approval workflow endpoints
└── alembic/           # Database migrations
    ├── env.py
    ├── script.py.mako
    └── versions/
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Update the following variables in `.env`:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/skill_management
SECRET_KEY=your-super-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 3. Database Setup

Create PostgreSQL database:

```sql
CREATE DATABASE skill_management;
```

Initialize Alembic and create initial migration:

```bash
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

### 4. Run the Application

```bash
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

### Authentication
- `POST /auth/google-login` - Google OAuth login
- `GET /auth/me` - Get current user info

### Users
- `GET /users/` - List all users
- `GET /users/profile` - Get user profile
- `GET /users/subordinates` - Get manager's subordinates
- `GET /users/{user_id}` - Get specific user

### Skills
- `POST /skills/` - Create skill submission
- `GET /skills/my-skills` - Get user's approved skills
- `GET /skills/my-submissions` - Get user's skill submissions
- `GET /skills/matching` - Get filtered skills
- `GET /skills/{skill_id}` - Get specific skill
- `DELETE /skills/{skill_id}` - Delete skill

### Approvals
- `GET /approvals/pending` - Get pending approvals (managers only)
- `GET /approvals/all` - Get all approvals (managers only)
- `POST /approvals/{submission_id}/approve` - Approve/reject submission
- `GET /approvals/{submission_id}` - Get specific submission

## Database Models

### User
- Basic user information
- Manager-subordinate relationships
- Google OAuth integration

### Skill & SubSkill
- Approved skills with proficiency levels
- Experience tracking
- Certification management

### SkillSubmission & SubSkillSubmission
- Pending skill submissions
- Approval workflow tracking
- Manager comments and modifications

## Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Development

### Adding New Endpoints

1. Create route handler in appropriate file under `routes/`
2. Define Pydantic schemas in `schemas/`
3. Add database models in `models/` if needed
4. Update imports in `__init__.py` files

### Database Migrations

Create new migration after model changes:

```bash
alembic revision --autogenerate -m "Description of changes"
alembic upgrade head
```

### Testing

The API includes comprehensive error handling and validation. Test endpoints using:

- FastAPI automatic docs: `http://localhost:8000/docs`
- ReDoc documentation: `http://localhost:8000/redoc`
- Direct API calls with tools like Postman or curl

## Production Deployment

1. Set production environment variables
2. Use a production WSGI server like Gunicorn
3. Configure reverse proxy (Nginx)
4. Set up SSL certificates
5. Configure database connection pooling
6. Implement proper logging and monitoring

## Security Features

- JWT token authentication
- Password hashing with bcrypt
- CORS configuration
- Input validation with Pydantic
- SQL injection prevention with SQLAlchemy ORM
- Role-based access control
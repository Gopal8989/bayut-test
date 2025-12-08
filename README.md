# Bayut Clone - Full-Stack Real Estate Platform

A comprehensive full-stack clone of [bayut.com](https://www.bayut.com), the leading real estate platform in the UAE. Built with **NestJS** (backend) and **Next.js** (frontend), featuring modern architecture, advanced security, and production-ready features.

## 🎯 Project Overview

This project is a complete recreation of Bayut's core functionality, including:
- Property listings with advanced filtering and pagination
- User authentication and authorization (JWT with refresh tokens)
- Property detail pages with image galleries
- User profile management (update profile, change password)
- Property creation and management (authenticated users)
- Contact agent functionality
- Responsive design matching Bayut's UI/UX
- API documentation with Swagger
- Advanced security and scalability features
- Email notifications (welcome, password reset, property inquiries)

## 🛠️ Tech Stack

### Backend
- **Framework**: NestJS 10.x
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with Passport.js (access + refresh tokens)
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI
- **Security**: Helmet, Rate Limiting, CORS
- **Logging**: Winston with daily rotation
- **File Upload**: Multer
- **Email**: Nodemailer with EJS templates

### Frontend
- **Framework**: Next.js 14.x
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios with interceptors
- **State Management**: React Hooks
- **Type Safety**: TypeScript

### Infrastructure & Patterns
- **Circuit Breaker**: Opossum
- **Retry Logic**: Exponential backoff with jitter
- **Caching**: In-memory cache with TTL
- **Queue System**: Priority-based task queue
- **Monitoring**: Performance metrics and health checks
- **Database Indexes**: Optimized indexes for search queries

## 📁 Project Structure

```
bayut-clone/
├── backend/
│   ├── src/
│   │   ├── auth/              # Authentication module
│   │   │   ├── dto/           # Login, Register DTOs
│   │   │   ├── guards/        # JWT guards
│   │   │   └── strategies/    # Passport JWT strategy
│   │   ├── property/          # Property CRUD operations
│   │   │   ├── dto/           # Create, Filter, Contact DTOs
│   │   │   └── dto/           # Create, Filter, Contact DTOs
│   │   ├── user/              # User management
│   │   │   └── dto/           # Update profile DTO
│   │   ├── prisma/            # Prisma ORM
│   │   │   └── schema.prisma  # Database schema
│   │   ├── upload/            # File upload handling
│   │   ├── email/             # Email service with EJS templates
│   │   │   └── templates/     # EJS email templates
│   │   └── common/            # Shared utilities
│   │       ├── logger/        # Winston logger
│   │       ├── circuit-breaker/  # Circuit breaker pattern
│   │       ├── retry/         # Retry with backoff
│   │       ├── cache/         # Caching service
│   │       ├── queue/         # Task queue
│   │       ├── metrics/       # Performance metrics
│   │       ├── interceptors/  # Request/response interceptors
│   │       ├── filters/       # Exception filters
│   │       └── controllers/   # Health endpoints
│   ├── logs/                  # Application logs
│   ├── uploads/               # Uploaded files
│   ├── .env.example           # Environment variables template
│   └── package.json
│
├── frontend/
│   ├── pages/                 # Next.js pages
│   │   ├── properties/        # Property pages ([id], create)
│   │   ├── my-properties.tsx  # User's properties
│   │   ├── profile.tsx        # User profile management
│   │   ├── agents.tsx         # Coming soon pages
│   │   ├── truestimate.tsx
│   │   ├── transactions.tsx
│   │   ├── projects.tsx
│   │   └── api-docs.tsx       # API documentation redirect
│   ├── components/            # React components
│   │   ├── PropertyCard.tsx
│   │   ├── ImageGallery.tsx
│   │   ├── ContactModal.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── Toast.tsx
│   │   └── ErrorBoundary.tsx
│   ├── lib/                   # Utilities
│   │   ├── api.ts            # Axios client
│   │   ├── auth.ts           # Auth utilities
│   │   ├── imageUtils.ts     # Image URL helpers
│   │   └── types.ts          # TypeScript types
│   ├── hooks/                 # Custom React hooks
│   │   └── useAuth.ts        # Authentication hook
│   ├── styles/               # Global styles
│   ├── .env.example          # Environment variables template
│   └── package.json
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** (local or cloud like Neon, Supabase, AWS RDS)
- **Git**

### Quick Setup

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd bayut-clone
```

#### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment file
# Windows PowerShell:
Copy-Item .env.example .env

# Windows CMD:
copy .env.example .env

# Linux/Mac:
cp .env.example .env

# Edit .env with your configuration (see Environment Variables section)

# Start development server
npm run start:dev
```

Backend will run on: **http://localhost:3001**

#### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Copy environment file
# Windows PowerShell:
Copy-Item .env.example .env.local

# Windows CMD:
copy .env.example .env.local

# Linux/Mac:
cp .env.example .env.local

# Edit .env.local with your API URL (see Environment Variables section)

# Start development server
npm run dev
```

Frontend will run on: **http://localhost:3000**

#### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api-docs
- **Health Check**: http://localhost:3001/health

## 🔐 Environment Variables

### Backend (.env)

Create `backend/.env` file with the following variables:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database (PostgreSQL)
# Option 1: Use DB_URL (recommended for production)
DB_URL=postgresql://username:password@host:port/database
# Example: DB_URL=postgresql://postgres:password@localhost:5432/bayut_clone
# Example (Neon): DB_URL=postgresql://user:pass@host.neon.tech/db?sslmode=require

# Option 2: Use individual variables (alternative)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=bayut_clone
DB_SSL=false
# Note: If DB_URL is set, individual variables are ignored
# For production PostgreSQL: Set DB_SSL=true and configure SSL certificates

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-token-key-minimum-32-characters-long

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Email Configuration (Optional - for email notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@bayut-clone.com
FRONTEND_URL=http://localhost:3000

# Cache Configuration
CACHE_TTL=300

# Logging
LOG_LEVEL=info
```

**Important Notes:**
- `JWT_SECRET` and `JWT_REFRESH_SECRET` must be at least 32 characters long
- For Gmail SMTP, use an [App Password](https://support.google.com/accounts/answer/185833) instead of your regular password
- Email service is optional - app will work without it, but email notifications won't be sent

### Frontend (.env.local)

Create `frontend/.env.local` file with the following variables:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Note:** For production, change `NEXT_PUBLIC_API_URL` to your production API URL.

## 📝 Available Commands

### Backend Commands

```bash
cd backend

# Development
npm run start:dev          # Start development server with hot reload

# Production
npm run build              # Build for production
npm run build:clean        # Clean build (removes dist folder first)
npm run start              # Start production server
npm run start:prod         # Start production server (alias)
npm run start:clean        # Clean build + start production

# Prisma Commands
npm run prisma:generate    # Generate Prisma Client
npm run prisma:push        # Push schema to database (dev)
npm run prisma:migrate     # Create and apply migration
npm run prisma:studio      # Open Prisma Studio (database GUI)

# Testing (if configured)
npm test                   # Run tests
```

### Frontend Commands

```bash
cd frontend

# Development
npm run dev                # Start development server

# Production
npm run build             # Build for production
npm run start             # Start production server

# Code Quality
npm run lint              # Run ESLint
```

## 📚 API Documentation

Interactive API documentation is available at `/api-docs` when the backend is running. It includes:
- All endpoints with descriptions
- Request/response schemas
- Authentication requirements
- Try-it-out functionality

### Key Endpoints

#### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user (returns access_token and refresh_token)
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user (invalidates refresh token)
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with token

#### Properties
- `GET /properties` - List properties (with filters and pagination)
  - Query params: `purpose`, `type`, `city`, `location`, `minPrice`, `maxPrice`, `bedrooms`, `bathrooms`, `minAreaSize`, `maxAreaSize`, `page`, `limit`
- `GET /properties/:id` - Get property details
- `POST /properties` - Create property (auth required, multipart/form-data)
- `PUT /properties/:id` - Update property (auth required)
- `DELETE /properties/:id` - Delete property (auth required)
- `GET /properties/my-properties` - Get user's properties (auth required, with filters and pagination)
- `GET /properties/cities` - Get list of cities
- `GET /properties/locations` - Get list of locations
- `POST /properties/contact` - Send inquiry to property agent (auth required)

#### Users
- `GET /users/profile` - Get user profile (auth required)
- `PUT /users/profile` - Update user profile (auth required)
- `POST /users/change-password` - Change password (auth required)

#### Health & Metrics
- `GET /health` - Health check
- `GET /health/metrics` - Performance metrics
- `GET /health/circuit-breakers` - Circuit breaker status

## 🎨 Features

### User Features
- ✅ User registration and login
- ✅ JWT-based authentication with refresh tokens
- ✅ Password reset via email
- ✅ Change password functionality
- ✅ User profile management (update profile, avatar)
- ✅ Property browsing with advanced filters
- ✅ Property detail pages with image galleries
- ✅ Property creation (authenticated users)
- ✅ My Properties page (user's own listings)
- ✅ Contact agent functionality
- ✅ Pagination for property listings
- ✅ Responsive design for all devices

### Advanced Features
- ✅ **Circuit Breaker Pattern** - Prevents cascading failures
- ✅ **Exponential Backoff Retry** - Handles transient failures
- ✅ **Request Queuing** - Manages concurrent requests
- ✅ **Caching Layer** - Improves performance (5min TTL)
- ✅ **Rate Limiting** - Prevents abuse (100 req/15min, 5 auth req/15min)
- ✅ **Comprehensive Logging** - Winston with daily rotation
- ✅ **Performance Monitoring** - Metrics and histograms
- ✅ **API Documentation** - Swagger/OpenAPI
- ✅ **Input Validation** - DTO validation with class-validator
- ✅ **Error Handling** - Graceful error handling with proper HTTP status codes
- ✅ **Database Indexes** - Optimized indexes for search queries
- ✅ **Email Templates** - Professional EJS templates for all email types
- ✅ **Image Upload** - Multiple image upload with Multer
- ✅ **Image Gallery** - Full-screen image viewer with thumbnails

## 📊 Database Schema

The database schema is defined in `backend/prisma/schema.prisma` using Prisma ORM.

### User Model
- `id`: UUID (Primary Key)
- `email`: String (unique, indexed)
- `password`: String (hashed)
- `firstName`, `lastName`: String
- `phone`: String (optional)
- `emailVerified`: Boolean (default: false)
- `emailVerificationToken`: String (indexed, optional)
- `passwordResetToken`: String (indexed, optional)
- `passwordResetExpires`: DateTime (optional)
- `refreshToken`: String (indexed, optional)
- `isActive`: Boolean (default: true)
- `lastLogin`: DateTime (optional)
- `avatar`: String (optional)
- `createdAt`, `updatedAt`: DateTime (auto)

### Property Model
- `id`: UUID (Primary Key)
- `userId`: UUID (Foreign Key → User, indexed)
- `title`: String
- `description`: String
- `price`: Decimal (indexed)
- `type`: PropertyType enum (indexed)
- `purpose`: PropertyPurpose enum (indexed)
- `location`: String (indexed)
- `city`: String (indexed)
- `area`: String (optional)
- `bedrooms`: Int (indexed, optional)
- `bathrooms`: Int (indexed, optional)
- `parking`: Int (optional)
- `areaSize`: Decimal (indexed, optional)
- `images`: String[] (array)
- `contactName`, `contactPhone`, `contactEmail`: String (optional)
- `createdAt`, `updatedAt`: DateTime (auto)

**Database Indexes:**
- **Property**: `purpose`, `type`, `city`, `location`, `price`, `bedrooms`, `bathrooms`, `areaSize`, `userId`, `createdAt`
- **User**: `email`, `emailVerificationToken`, `passwordResetToken`, `refreshToken`

**Relationships:**
- User has many Properties (One-to-Many)
- Property belongs to User (Many-to-One with CASCADE delete)

## 🚢 Deployment

### Production Checklist

#### Backend
1. Set `NODE_ENV=production`
2. Use strong `JWT_SECRET` and `JWT_REFRESH_SECRET` (min 32 characters)
3. Configure `ALLOWED_ORIGINS` with production frontend URL
4. Set up PostgreSQL database (use `DB_URL` in .env)
5. Run Prisma migrations: `npm run prisma:migrate` (for production)
6. Configure email service (SMTP credentials)
7. Set up log rotation
8. Configure rate limits appropriately
9. Enable HTTPS
10. Set up monitoring and alerts
11. Build: `npm run build:clean`
12. Start: `npm run start:prod`

#### Frontend
1. Set `NEXT_PUBLIC_API_URL` to production API URL
2. Build: `npm run build`
3. Start: `npm run start`
4. Or deploy to Vercel/Netlify (recommended)

### Environment Variables for Production

**Backend (.env):**
```env
NODE_ENV=production
PORT=3001
DB_URL=postgresql://user:pass@host:port/database
JWT_SECRET=<strong-secret-32-chars-min>
JWT_REFRESH_SECRET=<strong-secret-32-chars-min>
ALLOWED_ORIGINS=https://yourdomain.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

## 🧪 Testing

```bash
# Backend tests (if configured)
cd backend
npm test

# Frontend tests (if configured)
cd frontend
npm test
```

## 📖 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

ISC License

## 🙏 Acknowledgments

- Bayut.com for design inspiration
- NestJS and Next.js communities
- All open-source contributors

## 📞 Support

For issues and questions, please open an issue on the repository.

---

**Note**: This is a clone project for educational purposes. All design elements are inspired by bayut.com but implemented independently.

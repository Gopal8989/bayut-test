# Bayut Clone - Full-Stack Real Estate Platform

A comprehensive full-stack clone of [bayut.com](https://www.bayut.com), the leading real estate platform in the UAE. Built with **NestJS** (backend) and **Next.js** (frontend), featuring modern architecture, advanced security, and production-ready features.

## 🎯 Project Overview

This project is a complete recreation of Bayut's core functionality, including:
- Property listings with advanced filtering
- User authentication and authorization
- Property detail pages with image galleries
- Responsive design matching Bayut's UI/UX
- API documentation with Swagger
- Advanced security and scalability features

## 🛠️ Tech Stack

### Backend
- **Framework**: NestJS 10.x
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with Passport.js
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI
- **Security**: Helmet, Rate Limiting, CORS
- **Logging**: Winston with daily rotation
- **File Upload**: Multer

### Frontend
- **Framework**: Next.js 14.x
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **State Management**: React Hooks
- **Type Safety**: TypeScript

### Infrastructure & Patterns
- **Circuit Breaker**: Opossum
- **Retry Logic**: Exponential backoff with jitter
- **Caching**: In-memory cache with TTL
- **Queue System**: Priority-based task queue
- **Monitoring**: Performance metrics and health checks

## 📁 Project Structure

```
bayut-clone/
├── backend/
│   ├── src/
│   │   ├── auth/              # Authentication module
│   │   │   ├── dto/           # Data Transfer Objects
│   │   │   ├── guards/        # JWT guards
│   │   │   └── strategies/    # Passport strategies
│   │   ├── property/          # Property CRUD operations
│   │   │   ├── dto/           # Property DTOs
│   │   │   └── schemas/       # Mongoose schemas
│   │   ├── user/              # User management
│   │   ├── upload/            # File upload handling
│   │   ├── email/             # Email service
│   │   └── common/            # Shared utilities
│   │       ├── logger/       # Winston logger
│   │       ├── circuit-breaker/  # Circuit breaker pattern
│   │       ├── retry/        # Retry with backoff
│   │       ├── cache/        # Caching service
│   │       ├── queue/        # Task queue
│   │       ├── metrics/      # Performance metrics
│   │       ├── interceptors/ # Request/response interceptors
│   │       ├── filters/      # Exception filters
│   │       └── controllers/  # Health endpoints
│   ├── logs/                 # Application logs
│   └── uploads/              # Uploaded files
│
├── frontend/
│   ├── pages/                # Next.js pages
│   │   ├── properties/       # Property pages
│   │   └── api-docs.tsx      # API documentation redirect
│   ├── components/           # React components
│   │   ├── PropertyCard.tsx  # Property card component
│   │   ├── Badge.tsx         # Badge component
│   │   ├── LoadingSpinner.tsx
│   │   ├── Toast.tsx
│   │   └── ErrorBoundary.tsx
│   ├── lib/                  # Utilities
│   │   ├── api.ts           # Axios client
│   │   ├── api-client.ts    # Enhanced API client
│   │   ├── circuit-breaker.ts
│   │   ├── retry.ts
│   │   └── types.ts
│   └── styles/              # Global styles
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB (local or Atlas)
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd bayut-clone
```

2. **Backend Setup**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run start:dev
```

3. **Frontend Setup**
```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your API URL
npm run dev
```

4. **Access the Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Documentation: http://localhost:3001/api-docs

## 🔐 Environment Variables

### Backend (.env)
```env
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/bayut_clone
JWT_SECRET=your-secret-key-min-32-chars
ALLOWED_ORIGINS=http://localhost:3000
CACHE_TTL=300
LOG_LEVEL=info
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 📚 API Documentation

Interactive API documentation is available at `/api-docs` when the backend is running. It includes:
- All endpoints with descriptions
- Request/response schemas
- Authentication requirements
- Try-it-out functionality

### Key Endpoints

**Authentication**
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user

**Properties**
- `GET /properties` - List properties (with filters)
- `GET /properties/:id` - Get property details
- `POST /properties` - Create property (auth required)
- `PUT /properties/:id` - Update property (auth required)
- `DELETE /properties/:id` - Delete property (auth required)
- `GET /properties/cities` - Get list of cities
- `GET /properties/locations` - Get list of locations

**Health & Metrics**
- `GET /health` - Health check
- `GET /health/metrics` - Performance metrics
- `GET /health/circuit-breakers` - Circuit breaker status

## 🎨 Features

### User Features
- ✅ User registration and login
- ✅ JWT-based authentication
- ✅ Property browsing with filters
- ✅ Property detail pages with image galleries
- ✅ Property creation (authenticated users)
- ✅ Responsive design for all devices

### Advanced Features
- ✅ **Circuit Breaker Pattern** - Prevents cascading failures
- ✅ **Exponential Backoff Retry** - Handles transient failures
- ✅ **Request Queuing** - Manages concurrent requests
- ✅ **Caching Layer** - Improves performance
- ✅ **Rate Limiting** - Prevents abuse
- ✅ **Comprehensive Logging** - Winston with rotation
- ✅ **Performance Monitoring** - Metrics and histograms
- ✅ **API Documentation** - Swagger/OpenAPI
- ✅ **Input Validation** - DTO validation
- ✅ **Error Handling** - Graceful error handling

## 🤖 AI Tools Usage

This project extensively leveraged AI tools (specifically Cursor AI/Composer) during development. Here's how AI was used:

### 1. **Code Generation & Architecture**
- **Initial Project Structure**: AI helped generate the complete NestJS and Next.js project structure following best practices
- **Module Creation**: Generated authentication, property, user, and common utility modules with proper dependency injection
- **DTOs and Schemas**: Created all data transfer objects and Mongoose schemas with proper validation decorators

### 2. **Security Implementation**
- **Security Middleware**: AI suggested and implemented Helmet.js, rate limiting, and CORS configurations
- **JWT Strategy**: Generated Passport.js JWT strategy with proper validation
- **Password Hashing**: Implemented bcrypt with appropriate salt rounds
- **Input Validation**: Created comprehensive validation guards and decorators

### 3. **Advanced Patterns**
- **Circuit Breaker**: AI helped implement the circuit breaker pattern using Opossum library
- **Retry Logic**: Generated exponential backoff retry service with jitter to prevent thundering herd
- **Caching Strategy**: Implemented cache-aside pattern with TTL management
- **Queue System**: Created priority-based task queue for managing concurrent operations

### 4. **Frontend Development**
- **Component Design**: AI generated React components matching Bayut's design (PropertyCard, Badge, Toast, etc.)
- **API Integration**: Created enhanced API client with retry logic and circuit breaker
- **Error Handling**: Implemented error boundaries and toast notifications
- **Responsive Design**: Generated Tailwind CSS configurations matching Bayut's color scheme and layout

### 5. **API Documentation**
- **Swagger Setup**: AI configured Swagger/OpenAPI with proper decorators
- **DTO Documentation**: Added @ApiProperty decorators to all DTOs
- **Controller Documentation**: Documented all endpoints with examples and response codes

### 6. **Code Quality**
- **Type Safety**: Ensured TypeScript types throughout the codebase
- **Error Handling**: Generated comprehensive error handling with proper HTTP status codes
- **Logging**: Implemented structured logging with Winston
- **Code Organization**: Maintained clean architecture with proper separation of concerns

### 7. **Problem Solving**
- **Build Errors**: AI helped resolve TypeScript compilation errors and dependency conflicts
- **Configuration Issues**: Fixed Tailwind CSS v4 compatibility issues
- **Integration Challenges**: Resolved API integration and CORS issues

### 8. **Documentation**
- **README Creation**: AI generated comprehensive README with installation instructions
- **Code Comments**: Added meaningful comments explaining complex logic
- **API Documentation**: Generated Swagger documentation with examples

### AI-Assisted Workflow
1. **Planning Phase**: AI helped break down the project into manageable modules
2. **Implementation**: Generated boilerplate code and implemented complex patterns
3. **Debugging**: Assisted in identifying and fixing bugs
4. **Optimization**: Suggested performance improvements and best practices
5. **Documentation**: Generated comprehensive documentation

### Benefits of AI Usage
- **Faster Development**: Reduced development time by ~60%
- **Best Practices**: Ensured adherence to NestJS and Next.js best practices
- **Code Quality**: Generated clean, maintainable, and well-structured code
- **Learning**: Provided explanations for complex patterns and implementations
- **Consistency**: Maintained consistent coding style across the project

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📊 Database Schema

### User Schema
```typescript
{
  email: string (unique, required)
  password: string (hashed, required)
  firstName: string (required)
  lastName: string (required)
  phone?: string
  createdAt: Date
  updatedAt: Date
}
```

### Property Schema
```typescript
{
  title: string (required)
  description: string (required)
  price: number (required)
  type: PropertyType (enum)
  purpose: PropertyPurpose (enum)
  location: string (required)
  city: string (required)
  area?: string
  bedrooms?: number
  bathrooms?: number
  parking?: number
  areaSize?: number
  images: string[]
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  createdAt: Date
  updatedAt: Date
}
```

## 🚢 Deployment

### Production Checklist
1. Set `NODE_ENV=production`
2. Use strong `JWT_SECRET` (min 32 characters)
3. Configure `ALLOWED_ORIGINS` properly
4. Set up MongoDB connection string
5. Configure email service (if needed)
6. Set up log rotation
7. Configure rate limits appropriately
8. Enable HTTPS
9. Set up monitoring and alerts

### Docker (Optional)
```bash
docker-compose up -d
```

## 📝 License

ISC License

## 🙏 Acknowledgments

- Bayut.com for design inspiration
- NestJS and Next.js communities
- All open-source contributors
- Cursor AI/Composer for development assistance

## 📞 Support

For issues and questions, please open an issue on the repository.

---

**Note**: This is a clone project for educational purposes. All design elements are inspired by bayut.com but implemented independently.
#   b a y u t - t e s t  
 
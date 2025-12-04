# VietNovel API Server

Backend API server for the VietNovel platform built with Express.js, TypeScript, and MongoDB.

## Project Structure

```
api/
├── app.ts                    # Express app configuration
├── src/
│   ├── server.ts            # Server entry point
│   ├── config/
│   │   └── db.ts            # MongoDB connection
│   ├── controllers/
│   │   ├── authController.ts
│   │   └── novelController.ts
│   ├── models/
│   │   ├── User.ts
│   │   └── Novel.ts
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   └── novelRoutes.ts
│   ├── seed/
│   │   └── seed.ts          # Database seeding script
│   └── types/
│       └── index.ts         # TypeScript interfaces
├── package.json
├── tsconfig.json
└── .env
```

## Prerequisites

- Node.js 16+ 
- MongoDB Atlas account or local MongoDB instance
- npm or yarn

## Installation

```bash
cd api
npm install
```

## Environment Variables

Create a `.env` file in the `api` directory:

```env
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/vietnovel?retryWrites=true&w=majority
JWT_SECRET=your-secret-key-here
ADMIN_NAME=Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
```

## Running the Server

### Development (with hot reload)
```bash
npm run dev
```

### Development (single run)
```bash
npm run dev:run
```

### Production Build
```bash
npm run build
npm start
```

## Database Seeding

To populate the database with sample data:

```bash
npm run seed
```

This will:
- Connect to MongoDB
- Clear existing data
- Insert sample users (admin and regular users)
- Insert sample novels with chapters and comments
- Disconnect from database

## API Endpoints

### Health Check
- `GET /health` - Server status check

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `PUT /api/auth/users/:id` - Update user profile

### Novels
- `GET /api/novels` - Get all novels
- `POST /api/novels` - Create new novel
- `PUT /api/novels/:id` - Update novel
- `DELETE /api/novels/:id` - Delete novel

## TypeScript Configuration

The project uses strict TypeScript configuration for better type safety:

- `target: ES2020` - Modern JavaScript features
- `module: commonjs` - CommonJS module system
- `strict: true` - Full type checking
- Proper interface definitions for all data models

## Key Features

- ✓ TypeScript with strict type checking
- ✓ Express.js with proper middleware setup
- ✓ MongoDB with Mongoose ODM
- ✓ CORS enabled for frontend communication
- ✓ Database seeding with sample data
- ✓ Error handling and validation
- ✓ API response standardization

## Security Notes

⚠️ **Important:** 
- Passwords are currently stored in plain text. Implement bcrypt hashing in production.
- Use environment variables for sensitive data.
- Add JWT authentication middleware for protected routes.
- Implement rate limiting and input validation.

## Development Tips

- Watch mode automatically restarts server on file changes
- Check MongoDB Atlas connection limits if experiencing timeouts
- Ensure .env file is in the `api` directory, not in `src`
- Run `npm run seed` after first setup to populate sample data

## Troubleshooting

**MongoDB connection error:**
- Verify `MONGO_URI` in `.env`
- Check MongoDB Atlas IP whitelist settings
- Ensure network connectivity

**Port already in use:**
- Change `PORT` in `.env`
- Or kill the process: `lsof -ti:5000 | xargs kill -9`

**TypeScript errors after changes:**
- Run `npm run build` to check for compilation errors
- Ensure all imports use proper relative paths

## License

ISC

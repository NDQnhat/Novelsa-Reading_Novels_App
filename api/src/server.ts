import 'dotenv/config';
import connectDB from './config/db';
import app from '../app';

const PORT = process.env.PORT || 5000;

const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('✓ MongoDB connected');

    // Start Express server
    app.listen(PORT as any, '0.0.0.0', () => {
      console.log(`\n✓ Server is running on http://0.0.0.0:${PORT}`);
      console.log(`✓ Health Check: http://localhost:${PORT}/health`);
      console.log(`✓ Auth API: http://localhost:${PORT}/api/auth`);
      console.log(`✓ Novels API: http://localhost:${PORT}/api/novels`);
      console.log(`✓ Admin API: http://localhost:${PORT}/api/admin\n`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}\n`);
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to start server:', errorMessage);
    process.exit(1);
  }
};

startServer();

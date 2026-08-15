import http from 'http';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import app from './app';
import config from './config';
import logger from './logger';
import { initNotificationSocket } from './socket/notification.service';

async function bootstrap() {
  try {
    // 1. Database
    await mongoose.connect(config.mongodbUrl as string);
    logger.info('MongoDB connected successfully');

    // 2. HTTP Server
    const httpServer = http.createServer(app);

    // 3. Socket.IO
    const io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);

      socket.on('joinRoom', (userId) => {
        socket.join(userId);
      });

      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });

    initNotificationSocket(io);

    // 4. Start server
    httpServer.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
    });

    // 5. Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received. Shutting down server...`);

      httpServer.close(async () => {
        await mongoose.connection.close();

        logger.info('MongoDB connection closed');
        logger.info('Server shut down successfully');

        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error(error, 'Server failed to start');
    process.exit(1);
  }
}

bootstrap();

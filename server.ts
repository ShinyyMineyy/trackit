/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import apiRouter from './server/routes';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API router mapping
  app.use('/api', apiRouter);

  // Health endpoint
  app.get('/api-health', (req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  // Vite integration based on environment
  if (process.env.NODE_ENV !== 'production') {
    console.log('Initializing Vite development middleware server mode...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Running in static production delivery node server mode...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`===============================================`);
    console.log(` TrackIt Engine live on http://localhost:${PORT}`);
    console.log(`===============================================`);
  });
}

startServer().catch((error) => {
  console.error('Critical boot failure in TrackIt Server setup:', error);
});

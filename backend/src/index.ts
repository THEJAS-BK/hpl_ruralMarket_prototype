import express from 'express';
import cors from 'cors';
import router from './routes';
import { PORT, CROPS } from './config';
import { mandis, prices } from './store';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(router);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Gram Market backend running on port ${PORT}`);
  console.log(`  Data: ${mandis.length} mandis, ${prices.length} price records`);
  console.log(`  Crops: ${CROPS.join(', ')}`);
  console.log(`  Endpoints:`);
  console.log(`    GET /health`);
  console.log(`    GET /api/mandis`);
  console.log(`    GET /api/prices?crop=X`);
  console.log(`    GET /api/prices/history?crop=X&mandi=Y&days=N`);
  console.log(`    GET /api/compare?crop=X&mandiA=Y&mandiB=Z`);
  console.log(`    GET /api/recommend?crop=X`);
});

export { app };

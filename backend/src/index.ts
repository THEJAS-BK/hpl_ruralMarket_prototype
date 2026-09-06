import express from 'express';
import cors from 'cors';
import router from './routes';
import { PORT } from './config';
import { markets, commodities, prices, historyPoints, states, DATASET_CENTRE } from './store';

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
  console.log(`  Data: ${markets.length} markets, ${commodities.length} commodities, ${prices.length} price rows, ${historyPoints.length} history points`);
  console.log(`  Dataset centre: lat=${DATASET_CENTRE.lat}, lng=${DATASET_CENTRE.lng}`);
  console.log(`  States: ${states.join(', ')}`);
  console.log(`  Endpoints:`);
  console.log(`    GET /health`);
  console.log(`    GET /api/states`);
  console.log(`    GET /api/markets?state=X`);
  console.log(`    GET /api/commodities`);
  console.log(`    GET /api/prices?commodity=X&market=Y&state=Z`);
  console.log(`    GET /api/prices/latest?commodity=X`);
  console.log(`    GET /api/prices/history?commodity=X&market=Y&days=N`);
  console.log(`    GET /api/compare?commodity=X&marketA=Y&marketB=Z&origin=lat,lng`);
  console.log(`    GET /api/recommend?commodity=X&origin=lat,lng`);
});

export { app };
import 'dotenv/config';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();

app.use(createProxyMiddleware({
  target: process.env.ORDER_SERVICE_URL,
  changeOrigin: true,
  pathFilter: '/api/v1/orders',
  pathRewrite: { '^/api/v1': '' },
}));

app.use(createProxyMiddleware({
  target: process.env.INVENTORY_SERVICE_URL,
  changeOrigin: true,
  pathFilter: '/api/v1/inventory',
  pathRewrite: { '^/api/v1': '' },
}));

app.use(createProxyMiddleware({
  target: process.env.NOTIFICATION_SERVICE_URL,
  changeOrigin: true,
  pathFilter: '/api/v1/notifications',
  pathRewrite: { '^/api/v1': '' },
}));

app.use(createProxyMiddleware({
  target: process.env.DEAD_LETTER_SERVICE_URL,
  changeOrigin: true,
  pathFilter: '/api/v1/dead-letters',
  pathRewrite: { '^/api/v1': '' },
}));

app.listen(process.env.PORT, () => {
  console.log(`[gateway] Listening on port ${process.env.PORT}`);
});

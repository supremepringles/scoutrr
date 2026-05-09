import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..', '..');
const logPath = path.join(root, 'scoutrr.log');
const port = Number(process.env.FRONTEND_PORT || 3010);

const server = net.createServer();
server.once('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    const message = `Port ${port} is already in use. Set a different FRONTEND_PORT in .env and restart.`;
    console.error(message);
    fs.appendFileSync(logPath, `${new Date().toISOString()} ERROR frontend-port-check: ${message}\n`);
    process.exit(1);
  }
  throw error;
});
server.once('listening', () => {
  server.close(() => process.exit(0));
});
server.listen(port, '0.0.0.0');

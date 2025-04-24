import express from 'express';
import cors from 'cors';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import documentHandler from './documentHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/documents', documentHandler);

// ÚJ SORREND: Serve documents from the /app/src/documents directory under the /documents URL path
const documentsPath = path.resolve('/app/src/documents'); // Javított, abszolút útvonal a konténeren belül
app.use('/documents', express.static(documentsPath));

// ÚJ SORREND: Serve static files from the frontend build directory
const frontendDistPath = path.join(__dirname, '..'); 
app.use(express.static(frontendDistPath));

// Catch-all route to serve index.html for client-side routing
app.get('*', (_req, res) => { // Keep _req as it's unused
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Szerver fut a következő porton: ${port}`);
}); 
import express, { Request, Response } from 'express';
import multer from 'multer'; // Re-enable multer import
import path, { dirname } from 'path'; // Import dirname
import { fileURLToPath } from 'url'; // Import fileURLToPath
import * as fs from 'fs';

// Define __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Re-enable storage definition
const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    const documentsPath = path.join(__dirname, '../../src/documents');
    // Létrehozzuk a könyvtárat, ha nem létezik
    if (!fs.existsSync(documentsPath)) {
      fs.mkdirSync(documentsPath, { recursive: true });
    }
    cb(null, documentsPath);
  },
  filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    // Egyedi fájlnév generálása
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

// Re-enable multer instance
const upload = multer({ storage: storage });

// Re-enable upload route
router.post('/upload', upload.single('file'), (req: Request, res: Response): void => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Nincs feltöltött fájl' });
      return;
    }

    const fileData = {
      id: `doc-${Date.now()}`,
      title: req.body.title || req.file.originalname,
      url: req.file.filename,
      type: req.file.mimetype.startsWith('image/') ? 'image' : 
            req.file.mimetype === 'application/pdf' ? 'pdf' : 'text'
    };

    res.json(fileData);
  } catch (error) {
    console.error('Hiba a fájl feltöltése során:', error);
    res.status(500).json({ error: 'Hiba a fájl feltöltése során' });
  }
});

// Re-enable download route
router.get('/download/:filename', (req: Request, res: Response): void => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../../src/documents', filename);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'A fájl nem található' });
      return;
    }

    // Use res.sendFile to send the file for inline display
    res.sendFile(filePath);
  } catch (error) {
    console.error('Hiba a fájl letöltése során:', error);
    res.status(500).json({ error: 'Hiba a fájl letöltése során' });
  }
});

// Re-enable delete route
router.delete('/delete/:filename', (req: Request, res: Response): void => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../../src/documents', filename);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'A fájl nem található' });
      return;
    }

    fs.unlinkSync(filePath);
    res.json({ message: 'A fájl sikeresen törölve' });
  } catch (error) {
    console.error('Hiba a fájl törlése során:', error);
    res.status(500).json({ error: 'Hiba a fájl törlése során' });
  }
});

export default router; 
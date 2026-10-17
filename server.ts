import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Directories for database and storage
const DATA_DIR = path.resolve(__dirname, 'data');
const UPLOADS_DIR = path.resolve(DATA_DIR, 'uploads');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Interfaces
interface User {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  name: string;
  company: string;
  role: 'freelancer' | 'client';
  createdAt: string;
}

interface StoredFile {
  id: string;
  userId: string;
  originalName: string;
  storageName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  clientName: string;
  notes: string;
  portalSlug?: string;
  downloadCount: number;
}

interface ClientPortal {
  id: string;
  userId: string;
  clientName: string;
  clientEmail: string;
  slug: string;
  passcode?: string;
  description: string;
  createdAt: string;
}

interface Session {
  token: string;
  userId: string;
  expiresAt: number;
}

interface DatabaseSchema {
  users: User[];
  files: StoredFile[];
  portals: ClientPortal[];
  sessions: Session[];
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function loadDatabase(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading db.json, recreating initial store', err);
  }

  // Seed default demo user and sample files
  const salt = crypto.randomBytes(16).toString('hex');
  const demoUser: User = {
    id: 'user_sarah_101',
    email: 'sarah@clientvault.app',
    passwordHash: hashPassword('password123', salt),
    salt,
    name: 'Sarah Jenkins',
    company: 'Apex Design & Freelance',
    role: 'freelancer',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  };

  const seedFiles: { name: string; mime: string; client: string; notes: string; content: string }[] = [
    {
      name: 'Brand_Identity_Guidelines_v2.pdf',
      mime: 'application/pdf',
      client: 'Acme Corp',
      notes: 'Final approved typography, color codes and logo usage specs.',
      content: '%PDF-1.4\n1 0 obj\n<< /Title (Brand Identity Guidelines) /Author (Sarah Jenkins) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF',
    },
    {
      name: 'Mobile_App_Wireframes.png',
      mime: 'image/png',
      client: 'Bloom Studio',
      notes: 'High-fidelity dashboard screens for mobile viewport review.',
      content: '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x10\x00\x00\x00\x10\x08\x06\x00\x00\x00\x1f\xf3\xffa\x00\x00\x00\x19IDATx\x9cc\xfc\xff\xff?\x03\x03\x03\x13\x03\x03\x03\x00\x18\x05\x01\x01\x9a\xea\x1b\x90\x00\x00\x00\x00IEND\xaeB`\x82',
    },
    {
      name: 'Q3_Project_Scope_Contract.docx',
      mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      client: 'Acme Corp',
      notes: 'Signed contract with milestone schedules and deliverable dates.',
      content: 'PK\x03\x04ClientVault Project Scope Agreement for Acme Corp',
    },
    {
      name: 'Packaging_Label_Assets.zip',
      mime: 'application/zip',
      client: 'Kitsune Roasters',
      notes: 'High-res vector assets and bleed cuts for offset printing.',
      content: 'PK\x03\x04ClientVault Packaging Archive Assets',
    },
    {
      name: 'Product_Launch_Feedback_Notes.txt',
      mime: 'text/plain',
      client: 'Bloom Studio',
      notes: 'Stakeholder notes collected during last Tuesday client sync.',
      content: 'Client Sync Notes:\n1. Increase header contrast on hero cards\n2. Add direct download link in client portal\n3. Deliver final SVG logos by Friday.',
    },
  ];

  const files: StoredFile[] = [];
  seedFiles.forEach((seed, idx) => {
    const fileId = `file_${idx + 1}_${Date.now()}`;
    const storageName = `${fileId}_${seed.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = path.resolve(UPLOADS_DIR, storageName);
    try {
      fs.writeFileSync(filePath, seed.content);
    } catch (e) {
      console.error('Error writing seed file', e);
    }

    files.push({
      id: fileId,
      userId: demoUser.id,
      originalName: seed.name,
      storageName,
      mimeType: seed.mime,
      sizeBytes: Buffer.byteLength(seed.content),
      uploadedAt: new Date(Date.now() - (idx + 1) * 3600000 * 24).toISOString(),
      clientName: seed.client,
      notes: seed.notes,
      portalSlug: seed.client.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      downloadCount: idx * 2 + 1,
    });
  });

  const portals: ClientPortal[] = [
    {
      id: 'portal_acme',
      userId: demoUser.id,
      clientName: 'Acme Corp',
      clientEmail: 'contact@acmecorp.com',
      slug: 'acme-corp',
      description: 'Dedicated upload vault for Acme Corporation rebrand collateral.',
      createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    },
    {
      id: 'portal_bloom',
      userId: demoUser.id,
      clientName: 'Bloom Studio',
      clientEmail: 'design@bloomstudio.io',
      slug: 'bloom-studio',
      description: 'Secure file transfer portal for Bloom Studio UI/UX design deliverables.',
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    },
    {
      id: 'portal_kitsune',
      userId: demoUser.id,
      clientName: 'Kitsune Roasters',
      clientEmail: 'hello@kitsuneroasters.com',
      slug: 'kitsune-roasters',
      description: 'Print production packaging and label assets exchange.',
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
  ];

  const initialDb: DatabaseSchema = {
    users: [demoUser],
    files,
    portals,
    sessions: [],
  };

  saveDatabase(initialDb);
  return initialDb;
}

function saveDatabase(db: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write database file:', err);
  }
}

// Initialize database
let db = loadDatabase();

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${uniqueSuffix}_${sanitized}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit per file
  },
});

// JSON and URL parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auth Middleware
function authenticateUser(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  let token: string | null = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.query.token) {
    token = String(req.query.token).trim();
  }

  if (!token) {
    res.status(401).json({ error: 'Please sign in to access your files.' });
    return;
  }

  const session = db.sessions.find((s) => s.token === token && s.expiresAt > Date.now());

  if (!session) {
    res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
    return;
  }

  const user = db.users.find((u) => u.id === session.userId);
  if (!user) {
    res.status(401).json({ error: 'User account not found.' });
    return;
  }

  (req as any).user = user;
  next();
}

// =================== AUTH ROUTES ===================

// Sign Up
app.post('/api/auth/register', (req, res) => {
  const { email, password, name, company } = req.body;

  if (!email || !password || !name) {
    res.status(400).json({ error: 'Please provide full name, email, and password.' });
    return;
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const existing = db.users.find((u) => u.email === cleanEmail);
  if (existing) {
    res.status(409).json({ error: 'An account with this email address already exists. Please Sign In.' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    return;
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const newUser: User = {
    id: `user_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    email: cleanEmail,
    passwordHash: hashPassword(password, salt),
    salt,
    name: String(name).trim(),
    company: String(company || '').trim() || 'Freelance Studio',
    role: 'freelancer',
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);

  // Generate session token
  const token = crypto.randomBytes(32).toString('hex');
  db.sessions.push({
    token,
    userId: newUser.id,
    expiresAt: Date.now() + 14 * 86400000, // 14 days
  });

  saveDatabase(db);

  res.status(201).json({
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      company: newUser.company,
      role: newUser.role,
    },
    token,
  });
});

// Sign In
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Please provide both email and password.' });
    return;
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const user = db.users.find((u) => u.email === cleanEmail);

  if (!user) {
    res.status(401).json({ error: 'Invalid email or password. Please check your credentials.' });
    return;
  }

  const calculatedHash = hashPassword(password, user.salt);
  if (calculatedHash !== user.passwordHash) {
    res.status(401).json({ error: 'Invalid email or password. Please check your credentials.' });
    return;
  }

  const token = crypto.randomBytes(32).toString('hex');
  db.sessions.push({
    token,
    userId: user.id,
    expiresAt: Date.now() + 14 * 86400000,
  });

  saveDatabase(db);

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      company: user.company,
      role: user.role,
    },
    token,
  });
});

// Current User Profile
app.get('/api/auth/me', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      company: user.company,
      role: user.role,
    },
  });
});

// Sign Out
app.post('/api/auth/logout', authenticateUser, (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.substring(7).trim();
  if (token) {
    db.sessions = db.sessions.filter((s) => s.token !== token);
    saveDatabase(db);
  }
  res.json({ success: true, message: 'Signed out successfully.' });
});

// =================== FILE ROUTES (WITH USER ISOLATION) ===================

// Get all files for logged-in user
app.get('/api/files', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  const userFiles = db.files.filter((f) => f.userId === user.id);

  // Return file list sorted by newest first
  const sorted = [...userFiles].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  res.json({ files: sorted });
});

// Upload files (supports single or multiple files)
app.post('/api/files/upload', authenticateUser, upload.array('files', 10), (req, res) => {
  const user = (req as any).user as User;
  const uploadedFiles = req.files as Express.Multer.File[];

  if (!uploadedFiles || uploadedFiles.length === 0) {
    res.status(400).json({ error: 'No files provided for upload.' });
    return;
  }

  const clientName = req.body.clientName ? String(req.body.clientName).trim() : 'General';
  const notes = req.body.notes ? String(req.body.notes).trim() : '';

  const createdFileRecords: StoredFile[] = [];

  for (const f of uploadedFiles) {
    const fileId = `file_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const newRecord: StoredFile = {
      id: fileId,
      userId: user.id, // Strictly bound to current user
      originalName: f.originalname,
      storageName: f.filename,
      mimeType: f.mimetype,
      sizeBytes: f.size,
      uploadedAt: new Date().toISOString(),
      clientName,
      notes,
      portalSlug: clientName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      downloadCount: 0,
    };
    db.files.push(newRecord);
    createdFileRecords.push(newRecord);
  }

  saveDatabase(db);
  res.status(201).json({
    message: `Successfully uploaded ${createdFileRecords.length} file(s).`,
    files: createdFileRecords,
  });
});

// Download a file (with strict ownership security check)
app.get('/api/files/:id/download', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  const fileId = req.params.id;

  const fileRecord = db.files.find((f) => f.id === fileId);
  if (!fileRecord) {
    res.status(404).json({ error: 'File not found.' });
    return;
  }

  // Security Check: Only the owner can download
  if (fileRecord.userId !== user.id) {
    res.status(403).json({ error: 'Access denied: You do not have permission to access this file.' });
    return;
  }

  const filePath = path.resolve(UPLOADS_DIR, fileRecord.storageName);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Stored file content is missing on server.' });
    return;
  }

  fileRecord.downloadCount += 1;
  saveDatabase(db);

  res.download(filePath, fileRecord.originalName);
});

// Preview a file inline (images, pdf, text)
app.get('/api/files/:id/preview', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  const fileId = req.params.id;

  const fileRecord = db.files.find((f) => f.id === fileId);
  if (!fileRecord) {
    res.status(404).json({ error: 'File not found.' });
    return;
  }

  // Security Check
  if (fileRecord.userId !== user.id) {
    res.status(403).json({ error: 'Access denied: You do not have permission to view this file.' });
    return;
  }

  const filePath = path.resolve(UPLOADS_DIR, fileRecord.storageName);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Stored file content is missing on server.' });
    return;
  }

  res.setHeader('Content-Type', fileRecord.mimeType || 'application/octet-stream');
  res.setHeader('Content-Disposition', `inline; filename="${fileRecord.originalName}"`);
  fs.createReadStream(filePath).pipe(res);
});

// Delete a file (with strict ownership security check)
app.delete('/api/files/:id', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  const fileId = req.params.id;

  const fileIndex = db.files.findIndex((f) => f.id === fileId);
  if (fileIndex === -1) {
    res.status(404).json({ error: 'File not found.' });
    return;
  }

  const fileRecord = db.files[fileIndex];

  // Security check: Must belong to user
  if (fileRecord.userId !== user.id) {
    res.status(403).json({ error: 'Access denied: You cannot delete another user\'s files.' });
    return;
  }

  // Delete actual file from uploads directory
  const filePath = path.resolve(UPLOADS_DIR, fileRecord.storageName);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.warn('Could not remove file on disk:', err);
    }
  }

  // Remove from database
  db.files.splice(fileIndex, 1);
  saveDatabase(db);

  res.json({ success: true, message: `Deleted ${fileRecord.originalName} successfully.` });
});

// =================== CLIENT PORTAL ROUTES ===================

// Get all client portals for user
app.get('/api/portals', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  const userPortals = db.portals.filter((p) => p.userId === user.id);

  // Augment with file count and total size
  const portalsWithStats = userPortals.map((p) => {
    const clientFiles = db.files.filter((f) => f.userId === user.id && f.clientName.toLowerCase() === p.clientName.toLowerCase());
    const totalBytes = clientFiles.reduce((acc, f) => acc + f.sizeBytes, 0);
    return {
      ...p,
      fileCount: clientFiles.length,
      totalBytes,
    };
  });

  res.json({ portals: portalsWithStats });
});

// Create new client portal
app.post('/api/portals', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  const { clientName, clientEmail, description } = req.body;

  if (!clientName) {
    res.status(400).json({ error: 'Please provide a client or project name.' });
    return;
  }

  const slug = String(clientName).trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
  const existing = db.portals.find((p) => p.userId === user.id && p.slug === slug);
  if (existing) {
    res.status(409).json({ error: 'A portal for this client already exists.' });
    return;
  }

  const newPortal: ClientPortal = {
    id: `portal_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    userId: user.id,
    clientName: String(clientName).trim(),
    clientEmail: String(clientEmail || '').trim(),
    slug,
    description: String(description || '').trim() || `Secure upload portal for ${clientName}`,
    createdAt: new Date().toISOString(),
  };

  db.portals.push(newPortal);
  saveDatabase(db);

  res.status(201).json({ portal: newPortal });
});

// Public client portal info (for client upload page)
app.get('/api/public/portal/:slug', (req, res) => {
  const { slug } = req.params;
  const portal = db.portals.find((p) => p.slug === slug);

  if (!portal) {
    res.status(404).json({ error: 'Portal not found or link has expired.' });
    return;
  }

  const hostUser = db.users.find((u) => u.id === portal.userId);

  // Return public metadata (do not expose user credentials)
  res.json({
    portal: {
      clientName: portal.clientName,
      slug: portal.slug,
      description: portal.description,
      createdAt: portal.createdAt,
      freelancerName: hostUser?.name || 'Your Designer / Freelancer',
      company: hostUser?.company || 'Design Studio',
    },
  });
});

// Public upload from client into freelancer's vault
app.post('/api/public/portal/:slug/upload', upload.array('files', 10), (req, res) => {
  const { slug } = req.params;
  const portal = db.portals.find((p) => p.slug === slug);

  if (!portal) {
    res.status(404).json({ error: 'Portal not found.' });
    return;
  }

  const uploadedFiles = req.files as Express.Multer.File[];
  if (!uploadedFiles || uploadedFiles.length === 0) {
    res.status(400).json({ error: 'No files selected to upload.' });
    return;
  }

  const notes = req.body.notes ? String(req.body.notes).trim() : 'Uploaded via Client Portal link';
  const uploaderName = req.body.uploaderName ? String(req.body.uploaderName).trim() : portal.clientName;

  const addedFiles: StoredFile[] = [];
  for (const f of uploadedFiles) {
    const fileId = `file_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const newRecord: StoredFile = {
      id: fileId,
      userId: portal.userId, // Stored directly into freelancer's vault!
      originalName: f.originalname,
      storageName: f.filename,
      mimeType: f.mimetype,
      sizeBytes: f.size,
      uploadedAt: new Date().toISOString(),
      clientName: portal.clientName,
      notes: `${notes} (Uploaded by ${uploaderName})`,
      portalSlug: portal.slug,
      downloadCount: 0,
    };
    db.files.push(newRecord);
    addedFiles.push(newRecord);
  }

  saveDatabase(db);
  res.status(201).json({
    message: `Thank you! ${addedFiles.length} file(s) securely delivered to ${portal.clientName}'s vault.`,
    count: addedFiles.length,
  });
});

// Vite Integration & Static Serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ClientVault server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

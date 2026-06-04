/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { LocalDB } from './db';

const router = express.Router();
const db = new LocalDB();

const JWT_SECRET = process.env.JWT_KEY || 'mintflow_secret_token_jwt_key_99';

// Extends express Request type to hold credentials
export interface AuthRequest extends Request {
  adminEmail?: string;
}

// Admin authorization shield middleware
export function validateAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. Security Authorization token missing.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const verified = jwt.verify(token, JWT_SECRET) as { email: string };
    req.adminEmail = verified.email;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Session expired or invalid token authentication.' });
  }
}

// -------------------------------------------------------------
// AUTH OPERATIONS
// -------------------------------------------------------------
router.post('/auth/register', (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Please supply your name, email, and password.' });
  }

  try {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    const fresh = db.registerAdmin(email, name, hash);

    const token = jwt.sign({ email: fresh.email }, JWT_SECRET, { expiresIn: '7d' });
    db.addActivity('client', 'Freelancer Registered', `New freelancer account was registered: ${fresh.email}`);
    res.status(201).json({ token, admin: { email: fresh.email, name: fresh.name } });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Registration failed.' });
  }
});

router.post('/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please supply your email and secret password.' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const rawHash = db.getPasswordHash(normalizedEmail);

  if (!rawHash) {
    return res.status(401).json({ error: 'Authentication failed. Account not found.' });
  }

  const validPassword = bcrypt.compareSync(password, rawHash);
  if (!validPassword) {
    return res.status(401).json({ error: 'Authentication failed. Code invalid.' });
  }

  const token = jwt.sign({ email: normalizedEmail }, JWT_SECRET, { expiresIn: '7d' });
  const admin = db.getAdmins().find(a => a.email === normalizedEmail);

  db.addActivity('client', 'Administrator Login', `Admin account logged in securely from IP address.`);
  res.json({ token, admin: { email: normalizedEmail, name: admin?.name || 'TrackIt Administrator' } });
});

router.get('/auth/verify', validateAdmin, (req: AuthRequest, res) => {
  const admin = db.getAdmins().find(a => a.email === req.adminEmail);
  if (!admin) {
    return res.status(404).json({ error: 'Administrator session not found.' });
  }
  res.json({ admin });
});

router.post('/auth/change-password', validateAdmin, (req: AuthRequest, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Please provide both your existing and new authorization passwords.' });
  }

  const email = req.adminEmail!;
  const currentHash = db.getPasswordHash(email);
  if (!currentHash || !bcrypt.compareSync(oldPassword, currentHash)) {
    return res.status(400).json({ error: 'Existing password verification failed.' });
  }

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(newPassword, salt);
  
  // Set in memory DB
  const rawDB = (db as any).data;
  rawDB.passwordHashes[email] = hash;
  db.save();

  db.addActivity('client', 'Owner Password Changed', `Secure administrator hash changed.`);
  db.logEmail(email, 'TrackIt Profile Security Notification - Password Updated', 
    `Hello, your TrackIt portal password was updated. If you did not execute this action, please audit your cloud variables.`);
  
  res.json({ success: true, message: 'Password replaced successfully.' });
});


// -------------------------------------------------------------
// ANALYTICS & STATS
// -------------------------------------------------------------
router.get('/stats', validateAdmin, (req, res) => {
  const clients = db.getClients();
  const projects = db.getProjects();
  const payments = db.getPayments();
  const invoices = db.getInvoices();
  const events = db.getCalendarEvents();

  const totalClients = clients.length;
  const activeProjects = projects.filter(p => p.status === 'In Progress').length;
  const completedProjects = projects.filter(p => p.status === 'Completed').length;
  const pendingProjects = projects.filter(p => p.status === 'Pending').length;

  // Revenue totals
  let totalRevenue = 0;
  let pendingRevenue = 0;
  let monthlyRevenue = 0;

  const standardTime = new Date();
  const currentMonth = standardTime.getMonth();
  const currentYear = standardTime.getFullYear();

  payments.forEach(p => {
    totalRevenue += p.paidAmount;
    pendingRevenue += p.remainingAmount;
    
    // Check monthly earnings
    const updatedDate = new Date(p.updatedAt);
    if (updatedDate.getMonth() === currentMonth && updatedDate.getFullYear() === currentYear) {
      monthlyRevenue += p.paidAmount;
    }
  });

  // Project completion rate
  let projectCompletionRate = 0;
  if (projects.length > 0) {
    const totalDone = projects.filter(p => p.status === 'Completed').length;
    projectCompletionRate = Math.round((totalDone / projects.length) * 100);
  }

  // Upcoming deadlines (next 14 days)
  const deadTarget = new Date();
  deadTarget.setDate(deadTarget.getDate() + 14);
  const upcomingDeadlines = projects
    .filter(p => p.status !== 'Completed' && p.status !== 'Cancelled' && p.deadline)
    .map(p => ({
      projectId: p.id,
      projectName: p.name,
      deadline: p.deadline,
      remainingDays: Math.ceil((new Date(p.deadline).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    }))
    .sort((a,b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  // Calculate dynamic last 6 months revenue trend
  const revenueTrend: { month: string; Revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthName = d.toLocaleString('default', { month: 'short' });
    const monthIndex = d.getMonth();
    const year = d.getFullYear();

    let revenueSum = 0;
    payments.forEach(p => {
      const pDate = new Date(p.updatedAt);
      if (pDate.getMonth() === monthIndex && pDate.getFullYear() === year) {
        revenueSum += p.paidAmount;
      }
    });

    revenueTrend.push({
      month: monthName,
      Revenue: revenueSum
    });
  }

  res.json({
    counters: {
      totalClients,
      activeProjects,
      completedProjects,
      pendingProjects,
      totalRevenue,
      pendingRevenue,
      monthlyRevenue,
      projectCompletionRate
    },
    upcomingDeadlines,
    revenueTrend,
    recentPayments: payments
      .filter(p => p.paidAmount > 0)
      .map(p => {
        const associated = projects.find(pr => pr.id === p.projectId);
        return {
          id: p.id,
          projectName: associated?.name || 'Milestone Implementation',
          amount: p.paidAmount,
          date: p.updatedAt,
          status: p.status
        };
      })
      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5),
    recentInvoices: invoices
      .map(i => {
        const associated = projects.find(pr => pr.id === i.projectId);
        return {
          id: i.id,
          invoiceNumber: i.invoiceNumber,
          projectName: associated?.name || 'General Task Scope',
          amount: i.total,
          status: i.status,
          date: i.date
        };
      })
      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
  });
});


// -------------------------------------------------------------
// CLIENTS CRUD
// -------------------------------------------------------------
router.get('/clients', validateAdmin, (req, res) => {
  res.json(db.getClients());
});

router.get('/clients/archived', validateAdmin, (req, res) => {
  res.json(db.getArchivedClients());
});

router.get('/clients/:id', validateAdmin, (req, res) => {
  const client = db.getClient(req.params.id);
  if (!client) return res.status(404).json({ error: 'Client profile not found.' });

  const projects = db.getProjectsByClient(client.id);
  const portalToken = db.getPortalTokenForClient(client.id);

  res.json({ client, projects, portalToken });
});

router.post('/clients', validateAdmin, (req, res) => {
  const { name, email, phone, company, notes } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are strictly required to start a customer profile.' });
  }

  const { client, token } = db.createClient({ name, email, phone: phone || '', company: company || '', notes: notes || '' });
  db.addActivity('client', 'Client Registered', `${client.company ? client.company : client.name} was added to TrackIt database.`);
  
  res.status(201).json({ client, token });
});

router.put('/clients/:id', validateAdmin, (req, res) => {
  const client = db.updateClient(req.params.id, req.body);
  if (!client) return res.status(404).json({ error: 'Client record not found to update.' });

  db.addActivity('client', 'Client Contact Updated', `Altered contact credentials for ${client.name}.`);
  res.json(client);
});

router.delete('/clients/:id', validateAdmin, (req, res) => {
  const success = db.deleteClient(req.params.id);
  if (!success) return res.status(404).json({ error: 'Client profile not found or already deleted.' });

  db.addActivity('client', 'Client Contact Erased', `Erased user profile reference list from file tree.`);
  res.json({ success: true });
});


// -------------------------------------------------------------
// PROJECTS CRUD
// -------------------------------------------------------------
router.get('/projects', validateAdmin, (req, res) => {
  res.json(db.getProjects());
});

router.get('/projects/:id', validateAdmin, (req, res) => {
  const project = db.getProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project record not found.' });

  const client = db.getClient(project.clientId);
  const tasks = db.getTasksByProject(project.id);
  const updates = db.getUpdatesByProject(project.id);
  const invoices = db.getInvoicesByProject(project.id);
  const files = db.getFilesByProject(project.id);
  const documents = db.getDocumentsByProject(project.id);
  const events = db.getEventsByProject(project.id);
  const payment = db.getPaymentByProject(project.id);

  res.json({ project, client, tasks, updates, invoices, files, documents, events, payment });
});

router.post('/projects', validateAdmin, (req, res) => {
  const { name, description, clientId, budget, deadline, status } = req.body;
  
  if (!name || !clientId || !budget || !deadline) {
    return res.status(400).json({ error: 'Required fields: Name, Client, Budget, and Target Deadline.' });
  }

  const p = db.createProject({
    name,
    description: description || '',
    clientId,
    budget: Number(budget),
    deadline,
    status: status || 'Pending'
  });

  const client = db.getClient(clientId);
  db.addActivity('project', 'Project Initialized', `Project '${p.name}' initiated for customer ${client ? client.name : 'Unknown'}.`);
  
  db.createCalendarEvent({
    projectId: p.id,
    title: `Project: ${p.name} Target Deadline`,
    description: `Ultimate timeline release framework.`,
    date: p.deadline,
    type: 'Deadline'
  });

  if (client) {
    db.logEmail(client.email, `TrackIt System Notification - Project '${p.name}' Initiated`, 
      `Dear ${client.name},\n\nWe have initiated your project '${p.name}' on TrackIt! Your budget target is set at $${p.budget}. Your secure access portal token can be used to track progress in real-time.\n\nBest Regards,\nTrackIt Coordinator`);
  }

  res.status(201).json(p);
});

router.put('/projects/:id', validateAdmin, (req, res) => {
  const project = db.updateProject(req.params.id, req.body);
  if (!project) return res.status(404).json({ error: 'Project not found.' });

  db.addActivity('project', 'Project Updated', `Adjusted attributes on project record '${project.name}'.`);
  res.json(project);
});

router.delete('/projects/:id', validateAdmin, (req, res) => {
  const success = db.deleteProject(req.params.id);
  if (!success) return res.status(404).json({ error: 'Project target not found.' });

  db.addActivity('project', 'Project Deleted', `Purged project metadata from internal relational tables.`);
  res.json({ success: true });
});


// -------------------------------------------------------------
// TASKS & KANBAN
// -------------------------------------------------------------
router.get('/tasks/project/:projectId', validateAdmin, (req, res) => {
  res.json(db.getTasksByProject(req.params.projectId));
});

router.post('/tasks', validateAdmin, (req, res) => {
  const { projectId, title, description, status, dueDate } = req.body;
  if (!projectId || !title || !dueDate) {
    return res.status(400).json({ error: 'Tasks require a Valid Project connection, Title, and Target Due Date.' });
  }

  const t = db.createTask({
    projectId,
    title,
    description: description || '',
    status: status || 'Todo',
    dueDate
  });

  db.addActivity('task', 'Task Created', `Added task '${t.title}' to workflow.`);

  // Auto add to calendar
  db.createCalendarEvent({
    projectId,
    title: `Task: ${t.title} Due`,
    description: t.description || 'Deliverable cutoff date.',
    date: t.dueDate,
    type: 'Milestone'
  });

  res.status(201).json(t);
});

router.put('/tasks/:id', validateAdmin, (req, res) => {
  const task = db.updateTask(req.params.id, req.body);
  if (!task) return res.status(404).json({ error: 'Task profile not found.' });

  if (req.body.status && req.body.status === 'Done') {
    db.addActivity('task', 'Task Completed', `Task '${task.title}' was marked done.`);
    
    // Check if we should notify client about status
    const proj = db.getProject(task.projectId);
    if (proj) {
      const client = db.getClient(proj.clientId);
      if (client) {
        db.logEmail(client.email, `TrackIt Notification - Task '${task.title}' Completed!`, 
          `Dear ${client.name},\n\nWe have completed our milestone deliverable '${task.title}' on your active project '${proj.name}'. Progress is now calculated at ${proj.progress}%!\n\nBest Regards,\nTrackIt Client Operations`);
      }
    }
  } else {
    db.addActivity('task', 'Task Modifiers Altered', `State changed or due date rewritten for '${task.title}'.`);
  }

  res.json(task);
});

router.delete('/tasks/:id', validateAdmin, (req, res) => {
  const success = db.deleteTask(req.params.id);
  if (!success) return res.status(404).json({ error: 'Task not found.' });

  db.addActivity('task', 'Task Purged', 'Discarded milestone checklist block.');
  res.json({ success: true });
});


// -------------------------------------------------------------
// PROJECT UPDATES
// -------------------------------------------------------------
router.post('/updates', validateAdmin, (req, res) => {
  const { projectId, title, content } = req.body;
  if (!projectId || !title || !content) {
    return res.status(400).json({ error: 'Required fields: Project connection, Title statement, and Content logs.' });
  }

  const u = db.createUpdate({ projectId, title, content });
  db.addActivity('update', 'Project Update Logged', `Posted project status log: '${u.title}'.`);

  // Email notifications for project update!
  const proj = db.getProject(projectId);
  if (proj) {
    const client = db.getClient(proj.clientId);
    if (client) {
      db.logEmail(client.email, `TrackIt Portal Update - Project: '${proj.name}'`, 
        `Dear ${client.name},\n\nWe have logged a public progress update regarding '${proj.name}':\n\nTITLE: ${u.title}\n\n${u.content}\n\nLog into your client portal via your secure token link to view documentation and version boards.\n\nWarmly,\nYour Freelance Coordinator`);
    }
  }

  res.status(201).json(u);
});


// -------------------------------------------------------------
// PAYMENTS & INVOICES
// -------------------------------------------------------------
router.get('/invoices', validateAdmin, (req, res) => {
  res.json(db.getInvoices());
});

router.post('/invoices', validateAdmin, (req, res) => {
  const { projectId, date, dueDate, amount, details, status } = req.body;
  if (!projectId || !date || !dueDate || !amount) {
    return res.status(400).json({ error: 'Required fields: Project target, Billing date, Cutoff date, and Net value.' });
  }

  const net = Number(amount);
  const tax = Math.round(net * 0.05); // Standard 5% tax bracket matching blueprint guidelines
  const total = net + tax;

  const inv = db.createInvoice({
    projectId,
    date,
    dueDate,
    amount: net,
    tax,
    total,
    status: status || 'Unpaid',
    details: details || ''
  });

  const proj = db.getProject(projectId);
  if (proj) {
    const client = db.getClient(proj.clientId);
    if (client) {
      db.addActivity('invoice', 'Invoice Created', `Generated ${inv.invoiceNumber} for $${inv.total} directed to Apex/Stellar accounts.`);
      
      db.logEmail(client.email, `TrackIt Billing - Invoice ${inv.invoiceNumber} Generated`, 
        `Dear ${client.name},\n\nA professional billing statement ${inv.invoiceNumber} has been calculated for your project '${proj.name}'.\n\nInvoice Total: $${inv.total} (Base: $${inv.amount} plus 5% local service surcharge)\nCutoff Date: ${inv.dueDate}\n\nYou can review, print, or download this invoice PDF on your secure workspace portal.\n\nBest Regards,\nTrackIt Accounts Receivable`);
    }
  }

  res.status(201).json(inv);
});

router.put('/invoices/:id/status', validateAdmin, (req, res) => {
  const { status } = req.body;
  if (!status || (status !== 'Paid' && status !== 'Unpaid')) {
    return res.status(400).json({ error: 'Invoice status must be strictly Paid or Unpaid.' });
  }

  const inv = db.updateInvoiceStatus(req.params.id, status);
  if (!inv) return res.status(404).json({ error: 'Invoice not found.' });

  const proj = db.getProject(inv.projectId);
  if (proj) {
    const client = db.getClient(proj.clientId);
    if (client) {
      if (status === 'Paid') {
        db.addActivity('payment', 'Payment Deposited', `Payment verified for invoice ${inv.invoiceNumber}. Total received: $${inv.total}.`);
        db.logEmail(client.email, `TrackIt Receipt - Invoice ${inv.invoiceNumber} PAID`, 
          `Dear ${client.name},\n\nThank you for your payment. This email acts as an official receipt verifying that invoice ${inv.invoiceNumber} ($${inv.total}) was marked strictly PAID. Your payment tracker has updated.\n\nKind Regards,\nAccounts Desk`);
      } else {
        db.addActivity('payment', 'Payment Reflected Void', `Invoice ${inv.invoiceNumber} marked unpaid.`);
      }
    }
  }

  res.json(inv);
});

router.delete('/invoices/:id', validateAdmin, (req, res) => {
  const success = db.deleteInvoice(req.params.id);
  if (!success) return res.status(404).json({ error: 'Invoice target not found.' });

  db.addActivity('invoice', 'Invoice Destroyed', 'Erased accounting entry.');
  res.json({ success: true });
});


// -------------------------------------------------------------
// FILE & WIKI HANDLERS
// -------------------------------------------------------------
router.get('/files', validateAdmin, (req, res) => {
  res.json(db.getFiles());
});

router.post('/files', validateAdmin, (req, res) => {
  const { projectId, name, size, type, url, googleFileId } = req.body;
  if (!projectId || !name || !url) {
    return res.status(400).json({ error: 'Files require Project alignment, Filename string, and Web Access Path.' });
  }

  const file = db.createFile({
    projectId,
    name,
    size: Number(size) || 1024,
    type: type || 'application/octet-stream',
    url,
    googleFileId: googleFileId || undefined
  });

  db.addActivity('file', 'File Uploaded', `File '${file.name}' linked to drive attachments.`);
  res.status(201).json(file);
});

router.post('/files/:id/version', validateAdmin, (req, res) => {
  const { name, size, url, googleFileId } = req.body;
  if (!name || !url) return res.status(400).json({ error: 'Version replacement parameters invalid.' });

  const f = db.createFileVersion(req.params.id, name, Number(size) || 1200, url, googleFileId);
  if (!f) return res.status(404).json({ error: 'Original file target missing.' });

  db.addActivity('file', 'File Version Bumped', `Replaced '${f.name}' to version ${f.version}.`);
  res.status(201).json(f);
});

router.delete('/files/:id', validateAdmin, (req, res) => {
  const f = db.getFile(req.params.id);
  const ok = db.deleteFile(req.params.id);
  if (!ok) return res.status(404).json({ error: 'File descriptor missing.' });

  db.addActivity('file', 'File Purged', `Erased attachment resource '${f?.name}'.`);
  res.json({ success: true });
});

router.put('/projects/:projectId/wiki', validateAdmin, (req, res) => {
  const { content } = req.body;
  const ok = db.updateProjectWiki(req.params.projectId, content || '');
  if (!ok) return res.status(404).json({ error: 'Project wiki target not found.' });

  db.addActivity('wiki', 'Wiki Documentation Modified', `Updated Notion-styled wiki specifications.`);
  res.json({ success: true });
});


// -------------------------------------------------------------
// GOOGLE SERVICES LINKAGE
// -------------------------------------------------------------
router.get('/calendar', validateAdmin, (req, res) => {
  res.json(db.getCalendarEvents());
});

router.post('/calendar', validateAdmin, (req, res) => {
  const { projectId, title, description, date, time, type } = req.body;
  if (!title || !date || !type) {
    return res.status(400).json({ error: 'Calendar items require Title text, Event date, and structural Category.' });
  }

  const ev = db.createCalendarEvent({
    projectId: projectId || undefined,
    title,
    description: description || '',
    date,
    time: time || undefined,
    type
  });

  db.addActivity('project', 'Calendar Event Scheduled', `Synced milestone meeting '${ev.title}' with cloud calendar.`);
  res.status(201).json(ev);
});

router.delete('/calendar/:id', validateAdmin, (req, res) => {
  const ok = db.deleteCalendarEvent(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Calendar event not found.' });
  res.json({ success: true });
});

router.post('/documents', validateAdmin, (req, res) => {
  const { projectId, title, description, googleDocId, webViewUrl } = req.body;
  if (!projectId || !title) {
    return res.status(400).json({ error: 'Attached workspace structures require Project target and Title headers.' });
  }

  const doc = db.createDocument({
    projectId,
    title,
    description: description || '',
    googleDocId: googleDocId || undefined,
    webViewUrl: webViewUrl || `https://docs.google.com/document/d/mock-${Math.random().toString(36).substr(2,9)}`
  });

  db.addActivity('project', 'Google Document Nested', `Linked Google Doc reference '${doc.title}'.`);
  res.status(201).json(doc);
});

router.delete('/documents/:id', validateAdmin, (req, res) => {
  const ok = db.deleteDocument(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Document linked reference missing.' });
  res.json({ success: true });
});


// -------------------------------------------------------------
// HISTORIC & SIMULATED EMAIL TIMELINE FOR ADMINS
// -------------------------------------------------------------
router.get('/activity', validateAdmin, (req, res) => {
  res.json(db.getActivities());
});

router.get('/emails/sent', validateAdmin, (req, res) => {
  res.json(db.getEmailLogs());
});


// -------------------------------------------------------------
// GLOBAL CONSOLIDATED SEARCH API
// -------------------------------------------------------------
router.get('/search', validateAdmin, (req, res) => {
  const q = (req.query.q || '').toString().toLowerCase().trim();
  if (!q) return res.json({ clients: [], projects: [], tasks: [], invoices: [], files: [] });

  const raw = (db as any).data as any;

  const filteredClients = raw.clients.filter(c => !c.archived && (
    c.name.toLowerCase().includes(q) ||
    c.email.toLowerCase().includes(q) ||
    c.company.toLowerCase().includes(q) ||
    c.notes.toLowerCase().includes(q)
  ));

  const filteredProjects = raw.projects.filter(p => (
    p.name.toLowerCase().includes(q) ||
    p.description.toLowerCase().includes(q) ||
    (p.wikiContent || '').toLowerCase().includes(q)
  ));

  const filteredTasks = raw.tasks.filter(t => (
    t.title.toLowerCase().includes(q) ||
    t.description.toLowerCase().includes(q)
  ));

  const filteredInvoices = raw.invoices.filter(i => (
    i.invoiceNumber.toLowerCase().includes(q) ||
    i.details.toLowerCase().includes(q)
  ));

  const filteredFiles = raw.files.filter(f => (
    f.name.toLowerCase().includes(q)
  ));

  res.json({
    clients: filteredClients,
    projects: filteredProjects,
    tasks: filteredTasks,
    invoices: filteredInvoices,
    files: filteredFiles
  });
});


// -------------------------------------------------------------
// CLIENT SECURE PORTAL API (NO LOGIN OR JWT REQUIRED)
// -------------------------------------------------------------
router.get('/portal/:token', (req, res) => {
  const token = req.params.token;
  if (!token) return res.status(400).json({ error: 'Auth Secure Token query missing.' });

  const client = db.getClientByPortalToken(token);
  if (!client) {
    return res.status(404).json({ error: 'Invalid or expired Client Portal Access Token.' });
  }

  // Get everything related to this client specifically
  const projects = db.getProjectsByClient(client.id);
  const projectIds = projects.map(p => p.id);

  const raw = (db as any).data as any;

  const tasks = raw.tasks.filter(t => projectIds.includes(t.projectId));
  const updates = raw.updates.filter(u => projectIds.includes(u.projectId));
  const invoices = raw.invoices.filter(i => projectIds.includes(i.projectId));
  const files = raw.files.filter(f => projectIds.includes(f.projectId));
  const documents = raw.documents.filter(d => projectIds.includes(d.projectId));
  const events = raw.calendarEvents.filter(e => e.projectId && projectIds.includes(e.projectId));
  const payments = raw.payments.filter(p => projectIds.includes(p.projectId));

  // Timeline events related to their database entities
  const activities = raw.activities.filter(a => {
    const actLower = a.action.toLowerCase();
    const detailsLower = a.details.toLowerCase();
    
    // Check if activity mentions direct items from this client
    const projectMatch = projects.some(p => actLower.includes(p.name.toLowerCase()) || detailsLower.includes(p.name.toLowerCase()));
    const clientMatch = actLower.includes(client.name.toLowerCase()) || actLower.includes(client.company.toLowerCase());
    
    return projectMatch || clientMatch;
  });

  res.json({
    client: {
      id: client.id,
      name: client.name,
      company: client.company,
      email: client.email,
      phone: client.phone
    },
    projects,
    tasks,
    updates,
    invoices,
    files,
    documents,
    events,
    payments,
    activities
  });
});

export default router;

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { 
  Admin, Client, Project, Task, ProjectUpdate, Payment, 
  Invoice, FileModel, DocumentModel, CalendarEventModel, 
  ActivityModel, PortalToken, EmailLog
} from '../src/types';

const DB_PATH = path.join(process.cwd(), 'db.json');

const supabaseUrl = process.env.SUPABASE_URL || 'https://yzcghtrijsgsutalrtiu.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'sb_secret_Hg1SphQWRSycBOlpNoMHpQ_wl4Iy16W';

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

interface DatabaseSchema {
  admins: Admin[];
  passwordHashes: Record<string, string>; // adminEmail -> bcryptHash
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  updates: ProjectUpdate[];
  payments: Payment[];
  invoices: Invoice[];
  files: FileModel[];
  documents: DocumentModel[];
  calendarEvents: CalendarEventModel[];
  activities: ActivityModel[];
  portalTokens: PortalToken[];
  emails: EmailLog[];
}

const DEFAULT_DB: DatabaseSchema = {
  admins: [],
  passwordHashes: {},
  clients: [],
  projects: [],
  tasks: [],
  updates: [],
  payments: [],
  invoices: [],
  files: [],
  documents: [],
  calendarEvents: [],
  activities: [],
  portalTokens: [],
  emails: []
};

export class LocalDB {
  private data: DatabaseSchema = { ...DEFAULT_DB };

  constructor() {
    this.load();
    this.ensureAdminAndSeed();
    this.pullFromSupabase();
  }

  private load() {
    try {
      if (fs.existsSync(DB_PATH)) {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.data = { ...DEFAULT_DB };
        this.save();
      }
    } catch (e) {
      console.error('Error loading database, resetting to default', e);
      this.data = { ...DEFAULT_DB };
    }
  }

  private syncInProgress = false;

  public save() {
    try {
      // 1. Write immediately and synchronously to local file cache
      fs.writeFileSync(DB_PATH, JSON.stringify(this.data, null, 2), 'utf-8');

      // 2. Perform background sync to Supabase if client is active
      if (!supabase || this.syncInProgress) return;
      this.syncInProgress = true;
      
      (async () => {
        try {
          // Bulk upsert admins
          const adminsRows = this.data.admins.map(a => ({
            id: a.id,
            email: a.email,
            name: a.name,
            password_hash: this.data.passwordHashes[a.email] || ''
          }));
          if (adminsRows.length > 0) {
            await supabase.from('admins').upsert(adminsRows);
          }

          // Bulk upsert clients
          const clientsRows = this.data.clients.map(c => ({
            id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone || '',
            company: c.company || '',
            notes: c.notes || '',
            archived: !!c.archived,
            created_at: c.createdAt
          }));
          if (clientsRows.length > 0) {
            await supabase.from('clients').upsert(clientsRows);
          }

          // Bulk upsert projects
          const projectsRows = this.data.projects.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description || '',
            client_id: p.clientId,
            budget: p.budget,
            deadline: p.deadline,
            status: p.status,
            progress: p.progress,
            created_at: p.createdAt,
            wiki_content: p.wikiContent || ''
          }));
          if (projectsRows.length > 0) {
            await supabase.from('projects').upsert(projectsRows);
          }

          // Bulk upsert tasks
          const tasksRows = this.data.tasks.map(t => ({
            id: t.id,
            project_id: t.projectId,
            title: t.title,
            description: t.description || '',
            status: t.status,
            due_date: t.dueDate,
            created_at: t.createdAt
          }));
          if (tasksRows.length > 0) {
            await supabase.from('tasks').upsert(tasksRows);
          }

          // Bulk upsert updates
          const updatesRows = this.data.updates.map(u => ({
            id: u.id,
            project_id: u.projectId,
            title: u.title,
            content: u.content,
            timestamp: u.timestamp
          }));
          if (updatesRows.length > 0) {
            await supabase.from('updates').upsert(updatesRows);
          }

          // Bulk upsert payments
          const paymentsRows = this.data.payments.map(py => ({
            id: py.id,
            project_id: py.projectId,
            total_price: py.totalPrice,
            paid_amount: py.paidAmount,
            remaining_amount: py.remainingAmount,
            status: py.status,
            updated_at: py.updatedAt
          }));
          if (paymentsRows.length > 0) {
            await supabase.from('payments').upsert(paymentsRows);
          }

          // Bulk upsert invoices
          const invoicesRows = this.data.invoices.map(i => ({
            id: i.id,
            invoice_number: i.invoiceNumber,
            project_id: i.projectId,
            date: i.date,
            due_date: i.dueDate,
            amount: i.amount,
            tax: i.tax,
            total: i.total,
            status: i.status,
            details: i.details || '',
            created_at: i.createdAt
          }));
          if (invoicesRows.length > 0) {
            await supabase.from('invoices').upsert(invoicesRows);
          }

          // Bulk upsert portal tokens
          const tokensRows = this.data.portalTokens.map(pt => ({
            id: pt.id,
            client_id: pt.clientId,
            token: pt.token,
            created_at: pt.createdAt
          }));
          if (tokensRows.length > 0) {
            await supabase.from('portal_tokens').upsert(tokensRows);
          }

          // Bulk upsert calendar events
          const eventsRows = this.data.calendarEvents.map(e => ({
            id: e.id,
            project_id: e.projectId || null,
            title: e.title,
            description: e.description || '',
            date: e.date,
            time: e.time || null,
            google_event_id: e.googleEventId || null,
            type: e.type,
            created_at: e.createdAt
          }));
          if (eventsRows.length > 0) {
            await supabase.from('calendar_events').upsert(eventsRows);
          }

          // Bulk upsert activities
          const activitiesRows = this.data.activities.map(act => ({
            id: act.id,
            type: act.type,
            action: act.action,
            details: act.details,
            timestamp: act.timestamp
          }));
          if (activitiesRows.length > 0) {
            await supabase.from('activities').upsert(activitiesRows);
          }

          // Bulk upsert emails
          const emailsRows = this.data.emails.map(em => ({
            id: em.id,
            to_address: em.to,
            subject: em.subject,
            body: em.body,
            timestamp: em.timestamp
          }));
          if (emailsRows.length > 0) {
            await supabase.from('emails').upsert(emailsRows);
          }

          // Bulk upsert files
          const filesRows = this.data.files.map(f => ({
            id: f.id,
            project_id: f.projectId,
            name: f.name,
            size: f.size,
            type: f.type,
            url: f.url,
            google_file_id: f.googleFileId || null,
            version: f.version,
            created_at: f.createdAt
          }));
          if (filesRows.length > 0) {
            await supabase.from('files').upsert(filesRows);
          }

          // Bulk upsert file_versions
          const fileVersionsRows: any[] = [];
          this.data.files.forEach(f => {
            if (f.history && f.history.length > 0) {
              f.history.forEach((h, index) => {
                fileVersionsRows.push({
                  id: `${f.id}-v${h.version}`,
                  file_id: f.id,
                  version: h.version,
                  name: h.name,
                  size: h.size,
                  url: h.url,
                  google_file_id: h.googleFileId || null,
                  created_at: h.createdAt
                });
              });
            }
          });
          if (fileVersionsRows.length > 0) {
            await supabase.from('file_versions').upsert(fileVersionsRows);
          }

          // Bulk upsert documents
          const documentsRows = this.data.documents.map(d => ({
            id: d.id,
            project_id: d.projectId,
            title: d.title,
            description: d.description || '',
            google_doc_id: d.googleDocId || null,
            web_view_url: d.webViewUrl || null,
            created_at: d.createdAt
          }));
          if (documentsRows.length > 0) {
            await supabase.from('documents').upsert(documentsRows);
          }

        } catch (e) {
          console.error("Background Supabase bulk synchronization failed:", e);
        } finally {
          this.syncInProgress = false;
        }
      })();
    } catch (e) {
      console.error('Failed to save database file:', e);
    }
  }

  private async pushToSupabase(table: string, row: any) {
    if (!supabase) return;
    try {
      const { error } = await supabase.from(table).upsert(row);
      if (error) {
        console.error(`Error saving record to Supabase table ${table}:`, error);
      }
    } catch (e) {
      console.error(`Network or credentials error pushing to Supabase table ${table}:`, e);
    }
  }

  private async deleteFromSupabase(table: string, id: string) {
    if (!supabase) return;
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) {
        console.error(`Error deleting record from Supabase table ${table}:`, error);
      }
    } catch (e) {
      console.error(`Network or credentials error deleting from Supabase table ${table}:`, e);
    }
  }

  private async pullFromSupabase() {
    if (!supabase) return;
    try {
      console.log('Syncing data from Supabase DB to local cache...');
      
      // Fetch admins
      const { data: dbAdmins } = await supabase.from('admins').select('*');
      if (dbAdmins && dbAdmins.length > 0) {
        this.data.admins = dbAdmins.map(r => ({
          id: r.id,
          email: r.email,
          name: r.name
        }));
        dbAdmins.forEach(r => {
          this.data.passwordHashes[r.email] = r.password_hash;
        });
      }

      // Fetch clients
      const { data: dbClients } = await supabase.from('clients').select('*');
      if (dbClients) {
        this.data.clients = dbClients.map(r => ({
          id: r.id,
          name: r.name,
          email: r.email,
          phone: r.phone || '',
          company: r.company || '',
          notes: r.notes || '',
          archived: !!r.archived,
          createdAt: r.created_at || new Date().toISOString()
        }));
      }

      // Fetch projects
      const { data: dbProjects } = await supabase.from('projects').select('*');
      if (dbProjects) {
        this.data.projects = dbProjects.map(r => ({
          id: r.id,
          name: r.name,
          description: r.description || '',
          clientId: r.client_id,
          budget: Number(r.budget || 0),
          deadline: r.deadline,
          status: r.status,
          progress: Number(r.progress || 0),
          createdAt: r.created_at || new Date().toISOString(),
          wikiContent: r.wiki_content || ''
        }));
      }

      // Fetch tasks
      const { data: dbTasks } = await supabase.from('tasks').select('*');
      if (dbTasks) {
        this.data.tasks = dbTasks.map(r => ({
          id: r.id,
          projectId: r.project_id,
          title: r.title,
          description: r.description || '',
          status: r.status,
          dueDate: r.due_date,
          createdAt: r.created_at || new Date().toISOString()
        }));
      }

      // Fetch updates
      const { data: dbUpdates } = await supabase.from('updates').select('*');
      if (dbUpdates) {
        this.data.updates = dbUpdates.map(r => ({
          id: r.id,
          projectId: r.project_id,
          title: r.title,
          content: r.content,
          timestamp: r.timestamp || new Date().toISOString()
        }));
      }

      // Fetch payments
      const { data: dbPayments } = await supabase.from('payments').select('*');
      if (dbPayments) {
        this.data.payments = dbPayments.map(r => ({
          id: r.id,
          projectId: r.project_id,
          totalPrice: Number(r.total_price || 0),
          paidAmount: Number(r.paid_amount || 0),
          remainingAmount: Number(r.remaining_amount || 0),
          status: r.status,
          updatedAt: r.updated_at || new Date().toISOString()
        }));
      }

      // Fetch invoices
      const { data: dbInvoices } = await supabase.from('invoices').select('*');
      if (dbInvoices) {
        this.data.invoices = dbInvoices.map(r => ({
          id: r.id,
          invoiceNumber: r.invoice_number,
          projectId: r.project_id,
          date: r.date,
          dueDate: r.due_date,
          amount: Number(r.amount || 0),
          tax: Number(r.tax || 0),
          total: Number(r.total || 0),
          status: r.status,
          details: r.details || '',
          createdAt: r.created_at || new Date().toISOString()
        }));
      }

      // Fetch portal tokens
      const { data: dbTokens } = await supabase.from('portal_tokens').select('*');
      if (dbTokens) {
        this.data.portalTokens = dbTokens.map(r => ({
          id: r.id,
          clientId: r.client_id,
          token: r.token,
          createdAt: r.created_at || new Date().toISOString()
        }));
      }

      // Fetch calendar events
      const { data: dbEvents } = await supabase.from('calendar_events').select('*');
      if (dbEvents) {
        this.data.calendarEvents = dbEvents.map(r => ({
          id: r.id,
          projectId: r.project_id || undefined,
          title: r.title,
          description: r.description || '',
          date: r.date,
          time: r.time || undefined,
          googleEventId: r.google_event_id || undefined,
          type: r.type,
          createdAt: r.created_at || new Date().toISOString()
        }));
      }

      // Fetch activities
      const { data: dbActivities } = await supabase.from('activities').select('*');
      if (dbActivities) {
        this.data.activities = dbActivities.map(r => ({
          id: r.id,
          type: r.type,
          action: r.action,
          details: r.details,
          timestamp: r.timestamp || new Date().toISOString()
        }));
      }

      // Fetch emails
      const { data: dbEmails } = await supabase.from('emails').select('*');
      if (dbEmails) {
        this.data.emails = dbEmails.map(r => ({
          id: r.id,
          to: r.to_address,
          subject: r.subject,
          body: r.body,
          timestamp: r.timestamp || new Date().toISOString()
        }));
      }

      // Fetch files
      const { data: dbFiles } = await supabase.from('files').select('*');
      const { data: dbFileVersions } = await supabase.from('file_versions').select('*');
      if (dbFiles) {
        this.data.files = dbFiles.map(r => {
          const history = (dbFileVersions || [])
            .filter(v => v.file_id === r.id)
            .sort((a, b) => a.version - b.version)
            .map(v => ({
              version: v.version,
              name: v.name,
              size: v.size,
              url: v.url,
              googleFileId: v.google_file_id || undefined,
              createdAt: v.created_at || new Date().toISOString()
            }));
          return {
            id: r.id,
            projectId: r.project_id,
            name: r.name,
            size: Number(r.size || 0),
            type: r.type,
            url: r.url,
            googleFileId: r.google_file_id || undefined,
            version: Number(r.version || 1),
            history,
            createdAt: r.created_at || new Date().toISOString()
          };
        });
      }

      // Fetch documents
      const { data: dbDocuments } = await supabase.from('documents').select('*');
      if (dbDocuments) {
        this.data.documents = dbDocuments.map(r => ({
          id: r.id,
          projectId: r.project_id,
          title: r.title,
          description: r.description || '',
          googleDocId: r.google_doc_id || undefined,
          webViewUrl: r.web_view_url || undefined,
          createdAt: r.created_at || new Date().toISOString()
        }));
      }

      // Save local copy of pulled data
      this.save();
      console.log('Supabase sync successful!');
    } catch (err) {
      console.error('Failed to sync from Supabase database:', err);
    }
  }

  private ensureAdminAndSeed() {
    let changed = false;

    // Check admin
    const adminEmail = 'admin@trackit.local';
    const adminExist = this.data.admins.find(a => a.email === adminEmail);
    if (!adminExist) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync('TrackItAdmin123', salt);

      this.data.admins.push({
        id: 'admin-1',
        email: adminEmail,
        name: 'TrackIt Owner'
      });
      this.data.passwordHashes[adminEmail] = hash;
      changed = true;
    }

    // Check admin (public sandbox user admin@trackit.com)
    const adminEmailCom = 'admin@trackit.com';
    const adminExistCom = this.data.admins.find(a => a.email === adminEmailCom);
    if (!adminExistCom) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync('admin123', salt);

      this.data.admins.push({
        id: 'admin-com',
        email: adminEmailCom,
        name: 'TrackIt Owner'
      });
      this.data.passwordHashes[adminEmailCom] = hash;
      changed = true;
    } else {
      // Force ensure admin123 is the correct password
      const currentHash = this.data.passwordHashes[adminEmailCom];
      if (!currentHash || !bcrypt.compareSync('admin123', currentHash)) {
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync('admin123', salt);
        this.data.passwordHashes[adminEmailCom] = hash;
        changed = true;
      }
    }

    if (changed) {
      this.save();
    }
  }

  // Auth getters / setters / creators
  public getAdmins() { return this.data.admins; }
  public getPasswordHash(email: string) { return this.data.passwordHashes[email]; }

  public registerAdmin(email: string, name: string, passwordHash: string) {
    const emailNorm = email.toLowerCase().trim();
    const existing = this.data.admins.find(a => a.email === emailNorm);
    if (existing) {
      throw new Error('An administrator account with this email already exists.');
    }
    const fresh: Admin = {
      id: 'admin-' + Math.random().toString(36).substr(2, 9),
      email: emailNorm,
      name
    };
    this.data.admins.push(fresh);
    this.data.passwordHashes[emailNorm] = passwordHash;
    this.save();
    return fresh;
  }

  // Clients CRUD
  public getClients() { return this.data.clients.filter(c => !c.archived); }
  public getArchivedClients() { return this.data.clients.filter(c => c.archived); }
  public getClient(id: string) { return this.data.clients.find(c => c.id === id); }
  public createClient(client: Omit<Client, 'id' | 'createdAt' | 'archived'>) {
    const fresh: Client = {
      ...client,
      id: 'client-' + Math.random().toString(36).substr(2, 9),
      archived: false,
      createdAt: new Date().toISOString()
    };
    this.data.clients.push(fresh);
    // Auto-generate portal token immediately
    const token = Math.random().toString(36).substr(2, 12);
    this.data.portalTokens.push({
      id: 'token-' + Math.random().toString(36).substr(2, 9),
      clientId: fresh.id,
      token,
      createdAt: new Date().toISOString()
    });
    this.save();
    return { client: fresh, token };
  }
  public updateClient(id: string, updates: Partial<Client>) {
    const idx = this.data.clients.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.data.clients[idx] = { ...this.data.clients[idx], ...updates };
      this.save();
      return this.data.clients[idx];
    }
    return null;
  }
  public deleteClient(id: string) {
    this.data.clients = this.data.clients.filter(c => c.id !== id);
    this.data.portalTokens = this.data.portalTokens.filter(t => t.clientId !== id);
    this.save();
    this.deleteFromSupabase('clients', id);
    return true;
  }

  // Portal Tokens
  public getPortalTokenForClient(clientId: string) {
    return this.data.portalTokens.find(t => t.clientId === clientId)?.token || null;
  }
  public getClientByPortalToken(token: string) {
    const t = this.data.portalTokens.find(pt => pt.token === token);
    if (t) {
      return this.data.clients.find(c => c.id === t.clientId) || null;
    }
    return null;
  }

  // Projects CRUD
  public getProjects() { return this.data.projects; }
  public getProject(id: string) { return this.data.projects.find(p => p.id === id); }
  public getProjectsByClient(clientId: string) { return this.data.projects.filter(p => p.clientId === clientId); }
  public createProject(project: Omit<Project, 'id' | 'createdAt' | 'progress'>) {
    const fresh: Project = {
      ...project,
      id: 'proj-' + Math.random().toString(36).substr(2, 9),
      progress: 0,
      createdAt: new Date().toISOString()
    };
    this.data.projects.push(fresh);

    // Create entry in Payments tracker as well
    this.data.payments.push({
      id: 'pay-' + Math.random().toString(36).substr(2, 9),
      projectId: fresh.id,
      totalPrice: fresh.budget,
      paidAmount: 0,
      remainingAmount: fresh.budget,
      status: 'Pending',
      updatedAt: new Date().toISOString()
    });

    this.save();
    return fresh;
  }
  public updateProject(id: string, updates: Partial<Project>) {
    const idx = this.data.projects.findIndex(p => p.id === id);
    if (idx !== -1) {
      const original = this.data.projects[idx];
      this.data.projects[idx] = { ...original, ...updates };

      // Update associated budget payment if budget changed
      if (updates.budget !== undefined && updates.budget !== original.budget) {
        const pIdx = this.data.payments.findIndex(pay => pay.projectId === id);
        if (pIdx !== -1) {
          const pay = this.data.payments[pIdx];
          const rem = Math.max(0, updates.budget - pay.paidAmount);
          let stat: string = 'Pending';
          if (pay.paidAmount >= updates.budget) stat = 'Paid';
          else if (pay.paidAmount > 0) stat = 'Partially Paid';
          
          this.data.payments[pIdx] = {
            ...pay,
            totalPrice: updates.budget,
            remainingAmount: rem,
            status: stat as any,
            updatedAt: new Date().toISOString()
          };
        }
      }

      this.save();
      return this.data.projects[idx];
    }
    return null;
  }
  public deleteProject(id: string) {
    this.data.projects = this.data.projects.filter(p => p.id !== id);
    this.data.tasks = this.data.tasks.filter(t => t.projectId !== id);
    this.data.payments = this.data.payments.filter(py => py.projectId !== id);
    this.data.invoices = this.data.invoices.filter(i => i.projectId !== id);
    this.data.files = this.data.files.filter(f => f.projectId !== id);
    this.data.updates = this.data.updates.filter(u => u.projectId !== id);
    this.data.calendarEvents = this.data.calendarEvents.filter(e => e.projectId !== id);
    this.data.documents = this.data.documents.filter(d => d.projectId !== id);
    this.save();
    this.deleteFromSupabase('projects', id);
    return true;
  }

  // Recalculate Project Progress based on Tasks completed
  public recalculateProjectProgress(projectId: string) {
    const projTasks = this.data.tasks.filter(t => t.projectId === projectId);
    if (projTasks.length === 0) return;
    const completed = projTasks.filter(t => t.status === 'Done').length;
    const progress = Math.round((completed / projTasks.length) * 100);
    this.updateProject(projectId, { progress });
  }

  // Tasks CRUD
  public getTasksByProject(projectId: string) { return this.data.tasks.filter(t => t.projectId === projectId); }
  public getTasks() { return this.data.tasks; }
  public createTask(task: Omit<Task, 'id' | 'createdAt'>) {
    const fresh: Task = {
      ...task,
      id: 'task-' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    this.data.tasks.push(fresh);
    this.recalculateProjectProgress(task.projectId);
    this.save();
    return fresh;
  }
  public updateTask(id: string, updates: Partial<Task>) {
    const idx = this.data.tasks.findIndex(t => t.id === id);
    if (idx !== -1) {
      const origin = this.data.tasks[idx];
      this.data.tasks[idx] = { ...origin, ...updates };
      this.recalculateProjectProgress(origin.projectId);
      this.save();
      return this.data.tasks[idx];
    }
    return null;
  }
  public deleteTask(id: string) {
    const task = this.data.tasks.find(t => t.id === id);
    if (task) {
      const pId = task.projectId;
      this.data.tasks = this.data.tasks.filter(t => t.id !== id);
      this.recalculateProjectProgress(pId);
      this.save();
      this.deleteFromSupabase('tasks', id);
      return true;
    }
    return false;
  }

  // Updates CRUD
  public getUpdatesByProject(projectId: string) { 
    return this.data.updates.filter(u => u.projectId === projectId).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); 
  }
  public getUpdates() { return this.data.updates; }
  public createUpdate(update: Omit<ProjectUpdate, 'id' | 'timestamp'>) {
    const fresh: ProjectUpdate = {
      ...update,
      id: 'up-' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString()
    };
    this.data.updates.push(fresh);
    this.save();
    return fresh;
  }

  // Payments Tracker
  public getPayments() { return this.data.payments; }
  public getPaymentByProject(projectId: string) { return this.data.payments.find(p => p.projectId === projectId); }
  public updatePaymentAmounts(projectId: string, paidAmount: number) {
    const idx = this.data.payments.findIndex(p => p.projectId === projectId);
    if (idx !== -1) {
      const p = this.data.payments[idx];
      const rem = Math.max(0, p.totalPrice - paidAmount);
      let stat: string = 'Pending';
      if (paidAmount >= p.totalPrice) stat = 'Paid';
      else if (paidAmount > 0) stat = 'Partially Paid';

      this.data.payments[idx] = {
        ...p,
        paidAmount,
        remainingAmount: rem,
        status: stat as any,
        updatedAt: new Date().toISOString()
      };
      this.save();
      return this.data.payments[idx];
    }
    return null;
  }

  // Invoices CRUD
  public getInvoices() { return this.data.invoices; }
  public getInvoicesByProject(projectId: string) { return this.data.invoices.filter(i => i.projectId === projectId); }
  public getInvoice(id: string) { return this.data.invoices.find(i => i.id === id); }
  public createInvoice(inv: Omit<Invoice, 'id' | 'createdAt' | 'invoiceNumber'>) {
    const randomSuffix = Math.floor(Math.random() * 900) + 100;
    const num = `INV-${new Date().getFullYear()}-${randomSuffix}`;
    const fresh: Invoice = {
      ...inv,
      id: 'inv-' + Math.random().toString(36).substr(2, 9),
      invoiceNumber: num,
      createdAt: new Date().toISOString()
    };
    this.data.invoices.push(fresh);

    // If marked Paid, let's automatically add this to the project's aggregate Paid Amount tracker!
    if (inv.status === 'Paid') {
      const currentPay = this.getPaymentByProject(inv.projectId);
      if (currentPay) {
        const newPaid = currentPay.paidAmount + inv.total;
        this.updatePaymentAmounts(inv.projectId, newPaid);
      }
    }

    this.save();
    return fresh;
  }
  public updateInvoiceStatus(id: string, status: 'Paid' | 'Unpaid') {
    const idx = this.data.invoices.findIndex(i => i.id === id);
    if (idx !== -1) {
      const prev = this.data.invoices[idx];
      if (prev.status !== status) {
        this.data.invoices[idx].status = status;
        
        // Let's recalculate Paid amounts dynamically!
        const payment = this.getPaymentByProject(prev.projectId);
        if (payment) {
          let delta = prev.total;
          if (status === 'Unpaid') delta = -delta;
          const newPaid = Math.max(0, payment.paidAmount + delta);
          this.updatePaymentAmounts(prev.projectId, newPaid);
        }
      }
      this.save();
      return this.data.invoices[idx];
    }
    return null;
  }
  public deleteInvoice(id: string) {
    const inv = this.data.invoices.find(i => i.id === id);
    if (inv) {
      if (inv.status === 'Paid') {
        const pay = this.getPaymentByProject(inv.projectId);
        if (pay) {
          this.updatePaymentAmounts(inv.projectId, Math.max(0, pay.paidAmount - inv.total));
        }
      }
      this.data.invoices = this.data.invoices.filter(i => i.id !== id);
      this.save();
      this.deleteFromSupabase('invoices', id);
      return true;
    }
    return false;
  }

  // Wiki Note save
  public updateProjectWiki(projectId: string, markdown: string) {
    const idx = this.data.projects.findIndex(p => p.id === projectId);
    if (idx !== -1) {
      this.data.projects[idx].wikiContent = markdown;
      this.save();
      return true;
    }
    return false;
  }

  // Files CRUD
  public getFilesByProject(projectId: string) { return this.data.files.filter(f => f.projectId === projectId); }
  public getFiles() { return this.data.files; }
  public getFile(id: string) { return this.data.files.find(f => f.id === id); }
  public createFile(file: Omit<FileModel, 'id' | 'createdAt' | 'version' | 'history'>) {
    const fresh: FileModel = {
      ...file,
      id: 'file-' + Math.random().toString(36).substr(2, 9),
      version: 1,
      history: [],
      createdAt: new Date().toISOString()
    };
    this.data.files.push(fresh);
    this.save();
    return fresh;
  }
  public createFileVersion(id: string, name: string, size: number, url: string, gDriveId?: string) {
    const idx = this.data.files.findIndex(f => f.id === id);
    if (idx !== -1) {
      const file = this.data.files[idx];
      const oldVersion: any = {
        version: file.version,
        name: file.name,
        size: file.size,
        url: file.url,
        googleFileId: file.googleFileId,
        createdAt: file.createdAt
      };
      
      const updatedHistory = [...(file.history || []), oldVersion];
      const nextVer = file.version + 1;

      this.data.files[idx] = {
        ...file,
        name,
        size,
        url,
        googleFileId: gDriveId,
        version: nextVer,
        history: updatedHistory,
        createdAt: new Date().toISOString()
      };
      this.save();
      return this.data.files[idx];
    }
    return null;
  }
  public deleteFile(id: string) {
    this.data.files = this.data.files.filter(f => f.id !== id);
    this.save();
    this.deleteFromSupabase('files', id);
    return true;
  }

  // Google Documents Links
  public getDocumentsByProject(projectId: string) { return this.data.documents.filter(d => d.projectId === projectId); }
  public createDocument(doc: Omit<DocumentModel, 'id' | 'createdAt'>) {
    const fresh: DocumentModel = {
      ...doc,
      id: 'doc-' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    this.data.documents.push(fresh);
    this.save();
    return fresh;
  }
  public deleteDocument(id: string) {
    this.data.documents = this.data.documents.filter(d => d.id !== id);
    this.save();
    this.deleteFromSupabase('documents', id);
    return true;
  }

  // Calendar Events
  public getCalendarEvents() { return this.data.calendarEvents; }
  public getEventsByProject(projectId: string) { return this.data.calendarEvents.filter(e => e.projectId === projectId); }
  public createCalendarEvent(ev: Omit<CalendarEventModel, 'id' | 'createdAt'>) {
    const fresh: CalendarEventModel = {
      ...ev,
      id: 'ev-' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    this.data.calendarEvents.push(fresh);
    this.save();
    return fresh;
  }
  public deleteCalendarEvent(id: string) {
    this.data.calendarEvents = this.data.calendarEvents.filter(e => e.id !== id);
    this.save();
    this.deleteFromSupabase('calendar_events', id);
    return true;
  }

  // Global Activity Tracking
  public getActivities() { 
    return this.data.activities.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); 
  }
  public addActivity(type: ActivityModel['type'], action: string, details: string) {
    const fresh: ActivityModel = {
      id: 'act-' + Math.random().toString(36).substr(2, 9),
      type,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    this.data.activities.push(fresh);
    // Trim activities to make sure DB file doesn't load extremely slowly over centuries
    if (this.data.activities.length > 500) {
      this.data.activities = this.data.activities.slice(0, 500);
    }
    this.save();
    return fresh;
  }

  // Simulated Email Notification Logger
  public getEmailLogs() {
    return this.data.emails.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
  public logEmail(to: string, subject: string, body: string) {
    const fresh: EmailLog = {
      id: 'email-' + Math.random().toString(36).substr(2, 9),
      to,
      subject,
      body,
      timestamp: new Date().toISOString()
    };
    this.data.emails.push(fresh);
    this.save();
    return fresh;
  }
}

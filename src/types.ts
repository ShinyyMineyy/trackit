/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Admin {
  id: string;
  email: string;
  name: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  notes: string;
  archived: boolean;
  createdAt: string;
}

export type ProjectStatus = 'Pending' | 'In Progress' | 'Review' | 'Completed' | 'Cancelled';

export interface Project {
  id: string;
  name: string;
  description: string;
  clientId: string;
  budget: number;
  deadline: string;
  status: ProjectStatus;
  progress: number; // 0 to 100
  createdAt: string;
  wikiContent?: string; // Markdown WIKI/Notion content
}

export type TaskStatus = 'Todo' | 'In Progress' | 'Review' | 'Done';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  dueDate: string;
  createdAt: string;
}

export interface ProjectUpdate {
  id: string;
  projectId: string;
  title: string;
  content: string;
  timestamp: string;
}

export type PaymentStatus = 'Paid' | 'Partially Paid' | 'Pending' | 'Overdue';

export interface Payment {
  id: string;
  projectId: string;
  totalPrice: number;
  paidAmount: number;
  remainingAmount: number;
  status: PaymentStatus;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  projectId: string;
  date: string;
  dueDate: string;
  amount: number;
  tax: number;
  total: number;
  status: 'Paid' | 'Unpaid';
  details: string; // JSON or plaintext details of line items
  createdAt: string;
}

export interface FileModel {
  id: string;
  projectId: string;
  name: string;
  size: number;
  type: string;
  url: string; // If GDrive: gdrive webViewUrl, else relative/blobs
  googleFileId?: string;
  version: number;
  history?: FileVersion[];
  createdAt: string;
}

export interface FileVersion {
  version: number;
  name: string;
  size: number;
  url: string;
  googleFileId?: string;
  createdAt: string;
}

export interface DocumentModel {
  id: string;
  projectId: string;
  title: string;
  description: string;
  googleDocId?: string;
  webViewUrl?: string;
  createdAt: string;
}

export interface CalendarEventModel {
  id: string;
  projectId?: string;
  title: string;
  description: string;
  date: string; // ISO Date String
  time?: string;
  googleEventId?: string;
  type: 'Deadline' | 'Meeting' | 'Milestone';
  createdAt: string;
}

export interface ActivityModel {
  id: string;
  type: 'client' | 'project' | 'task' | 'invoice' | 'payment' | 'file' | 'update' | 'wiki';
  action: string; // e.g. "Invoice INV-001 created"
  details: string;
  timestamp: string;
}

export interface PortalToken {
  id: string;
  clientId: string;
  token: string;
  createdAt: string;
}

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  body: string;
  timestamp: string;
}

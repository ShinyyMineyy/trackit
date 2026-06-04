-- ====================================================================
--                 TRACKIT DATABASE SCHEMA (SUPABASE POSTGRES)
-- ====================================================================
-- INSTRUCTIONS:
-- 1. Log in to your Supabase Dashboard (https://supabase.com).
-- 2. Select your Project and navigate to the "SQL Editor" in the left sidebar.
-- 3. Click "New Query" and paste the entire contents of this file.
-- 4. Click "Run" on the top right. 
-- All tables, checks, relationships, and default admin users will be created instantly.
-- ====================================================================

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- Delete existing tables if they exist (to allow quick re-runs)
drop table if exists emails cascade;
drop table if exists portal_tokens cascade;
drop table if exists activities cascade;
drop table if exists calendar_events cascade;
drop table if exists documents cascade;
drop table if exists file_versions cascade;
drop table if exists files cascade;
drop table if exists invoices cascade;
drop table if exists payments cascade;
drop table if exists updates cascade;
drop table if exists tasks cascade;
drop table if exists projects cascade;
drop table if exists clients cascade;
drop table if exists admins cascade;

-- 1. ADMINS (Freelancers / Workers) TABLE
create table admins (
    id text primary key,
    email text unique not null,
    name text not null,
    password_hash text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. CLIENTS TABLE
create table clients (
    id text primary key,
    name text not null,
    email text not null,
    phone text default '' not null,
    company text default '' not null,
    notes text default '' not null,
    archived boolean default false not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. PROJECTS TABLE
create table projects (
    id text primary key,
    name text not null,
    description text default '' not null,
    client_id text references clients(id) on delete cascade not null,
    budget numeric default 0 not null,
    deadline date not null,
    status text default 'Pending' not null check (status in ('Pending', 'In Progress', 'Review', 'Completed', 'Cancelled')),
    progress integer default 0 not null check (progress >= 0 and progress <= 100),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    wiki_content text default '' not null
);

-- 4. TASKS TABLE
create table tasks (
    id text primary key,
    project_id text references projects(id) on delete cascade not null,
    title text not null,
    description text default '' not null,
    status text default 'Todo' not null check (status in ('Todo', 'In Progress', 'Review', 'Done')),
    due_date date not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. PROJECT UPDATES TABLE
create table updates (
    id text primary key,
    project_id text references projects(id) on delete cascade not null,
    title text not null,
    content text not null,
    timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. PAYMENTS TABLE
create table payments (
    id text primary key,
    project_id text references projects(id) on delete cascade not null,
    total_price numeric default 0 not null,
    paid_amount numeric default 0 not null,
    remaining_amount numeric default 0 not null,
    status text default 'Pending' not null check (status in ('Paid', 'Partially Paid', 'Pending', 'Overdue')),
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. INVOICES TABLE
create table invoices (
    id text primary key,
    invoice_number text not null unique,
    project_id text references projects(id) on delete cascade not null,
    date date not null,
    due_date date not null,
    amount numeric default 0 not null,
    tax numeric default 0 not null,
    total numeric default 0 not null,
    status text default 'Unpaid' not null check (status in ('Paid', 'Unpaid')),
    details text default '' not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. FILES TABLE
create table files (
    id text primary key,
    project_id text references projects(id) on delete cascade not null,
    name text not null,
    size integer default 0 not null,
    type text default 'application/octet-stream' not null,
    url text not null,
    google_file_id text,
    version integer default 1 not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. FILE VERSIONS TABLE (Detailed tracker for version history)
create table file_versions (
    id text primary key,
    file_id text references files(id) on delete cascade not null,
    version integer not null,
    name text not null,
    size integer not null,
    url text not null,
    google_file_id text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. GOOGLE DOCUMENTS TABLE
create table documents (
    id text primary key,
    project_id text references projects(id) on delete cascade not null,
    title text not null,
    description text default '' not null,
    google_doc_id text,
    web_view_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 11. CALENDAR EVENTS TABLE
create table calendar_events (
    id text primary key,
    project_id text references projects(id) on delete cascade,
    title text not null,
    description text default '' not null,
    date text not null,
    time text,
    google_event_id text,
    type text not null check (type in ('Deadline', 'Meeting', 'Milestone')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 12. TEAM ACTIVITIES TABLE
create table activities (
    id text primary key,
    type text not null,
    action text not null,
    details text not null,
    timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 13. PORTAL ACCESS TOKENS TABLE
create table portal_tokens (
    id text primary key,
    client_id text references clients(id) on delete cascade not null,
    token text unique not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 14. INGOING/OUTGOING SYSTEM EMAILS TABLE
create table emails (
    id text primary key,
    to_address text not null,
    subject text not null,
    body text not null,
    timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Seed initial admin user
-- Username: admin@trackit.com
-- Password: admin123 (hashed using standard bcrypt default config)
insert into admins (id, email, name, password_hash)
values (
    'admin-init', 
    'admin@trackit.com', 
    'TrackIt Manager', 
    '$2b$10$fxSvYfhEEUMaARaw4yVBE.Rda9uXvPc7GmnPBabigT5JYbe79kcsC' -- matches bcrypt hash of admin123
) on conflict do nothing;

create index idx_projects_client on projects(client_id);
create index idx_tasks_project on tasks(project_id);
create index idx_invoices_project on invoices(project_id);
create index idx_portal_token_client on portal_tokens(client_id);

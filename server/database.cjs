const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'cleaning_scheduler.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  -- Owners table
  CREATE TABLE IF NOT EXISTS owners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Cost profiles table
  CREATE TABLE IF NOT EXISTS cost_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    base_price REAL NOT NULL DEFAULT 0,
    dog_surcharge REAL DEFAULT 0,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Houses table
  CREATE TABLE IF NOT EXISTS houses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    owner_id INTEGER NOT NULL,
    cost_profile_id INTEGER NOT NULL,
    allows_dogs BOOLEAN DEFAULT 0,
    number_of_rooms INTEGER,
    square_footage REAL,
    default_cleaner_id INTEGER,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
    FOREIGN KEY (cost_profile_id) REFERENCES cost_profiles(id) ON DELETE RESTRICT,
    FOREIGN KEY (default_cleaner_id) REFERENCES cleaners(id) ON DELETE SET NULL
  );

  -- Cleaners table
  CREATE TABLE IF NOT EXISTS cleaners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Bookings table
  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    house_id INTEGER NOT NULL,
    guest_name TEXT,
    guest_email TEXT,
    guest_phone TEXT,
    checkin_datetime DATETIME NOT NULL,
    checkout_datetime DATETIME NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (house_id) REFERENCES houses(id) ON DELETE CASCADE
  );

  -- Cleaning jobs table
  CREATE TABLE IF NOT EXISTS cleaning_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    house_id INTEGER NOT NULL,
    booking_id INTEGER,
    cleaner_id INTEGER NOT NULL,
    scheduled_datetime DATETIME NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled')),
    base_cost REAL NOT NULL,
    dog_surcharge REAL DEFAULT 0,
    extra_charges REAL DEFAULT 0,
    extra_charges_description TEXT,
    total_cost REAL NOT NULL,
    completed_at DATETIME,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (house_id) REFERENCES houses(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    FOREIGN KEY (cleaner_id) REFERENCES cleaners(id) ON DELETE RESTRICT
  );

  -- Invoices table
  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cleaning_job_id INTEGER NOT NULL UNIQUE,
    invoice_number TEXT UNIQUE NOT NULL,
    owner_id INTEGER NOT NULL,
    house_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    pdf_path TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'sent', 'paid', 'overdue')),
    due_date DATETIME,
    notes TEXT,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cleaning_job_id) REFERENCES cleaning_jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
    FOREIGN KEY (house_id) REFERENCES houses(id) ON DELETE CASCADE
  );

  -- Indexes for better query performance
  CREATE INDEX IF NOT EXISTS idx_bookings_house ON bookings(house_id);
  CREATE INDEX IF NOT EXISTS idx_bookings_checkout ON bookings(checkout_datetime);
  CREATE INDEX IF NOT EXISTS idx_cleaning_jobs_house ON cleaning_jobs(house_id);
  CREATE INDEX IF NOT EXISTS idx_cleaning_jobs_status ON cleaning_jobs(status);
  CREATE INDEX IF NOT EXISTS idx_cleaning_jobs_scheduled ON cleaning_jobs(scheduled_datetime);
  CREATE INDEX IF NOT EXISTS idx_invoices_cleaning_job ON invoices(cleaning_job_id);
  CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
`);

console.log('Database initialized successfully!');

module.exports = db;

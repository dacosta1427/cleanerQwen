const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const db = require('./database');
const { generateInvoicePDF } = require('./pdf-generator');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'clean-scheduler-secret-key-change-in-production';

app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(cookieParser());
app.use('/invoices', express.static(path.join(__dirname, '..', 'invoices')));

// Auth middleware
function authenticateToken(req, res, next) {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT * FROM users WHERE id = ? AND is_active = 1').get(decoded.userId);
    if (!user) return res.status(401).json({ error: 'User not found or inactive' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// Role-based authorization middleware
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

// Helper function to generate invoice number
function generateInvoiceNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const result = db.prepare('SELECT COUNT(*) as count FROM invoices').get();
  const seq = String(result.count + 1).padStart(4, '0');
  return `INV-${year}${month}-${seq}`;
}

// ==================== AUTHENTICATION ====================

app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ? AND is_active = 1').get(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = bcrypt.compareSync(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({ 
      user: { id: user.id, username: user.username, role: user.role, ownerId: user.owner_id, cleanerId: user.cleaner_id },
      token 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ 
    user: { 
      id: req.user.id, 
      username: req.user.username, 
      role: req.user.role,
      ownerId: req.user.owner_id,
      cleanerId: req.user.cleaner_id
    } 
  });
});

// User management (Admin only)
app.get('/api/users', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const users = db.prepare(`
      SELECT u.id, u.username, u.role, u.is_active, u.created_at,
             o.name as owner_name, c.name as cleaner_name
      FROM users u
      LEFT JOIN owners o ON u.owner_id = o.id
      LEFT JOIN cleaners c ON u.cleaner_id = c.id
      ORDER BY u.created_at DESC
    `).all();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const { username, password, role, owner_id, cleaner_id } = req.body;
    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Username, password, and role required' });
    }
    if (!['admin', 'owner', 'cleaner'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = db.prepare(`
      INSERT INTO users (username, password_hash, role, owner_id, cleaner_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(username, hashedPassword, role, owner_id || null, cleaner_id || null);

    res.status(201).json({ id: result.lastInsertRowid, username, role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const { password, is_active, owner_id, cleaner_id } = req.body;
    const userId = req.params.id;

    let updateSQL = 'UPDATE users SET ';
    const params = [];

    if (password) {
      updateSQL += 'password_hash = ?, ';
      params.push(bcrypt.hashSync(password, 10));
    }
    if (is_active !== undefined) {
      updateSQL += 'is_active = ?, ';
      params.push(is_active ? 1 : 0);
    }
    if (owner_id !== undefined) {
      updateSQL += 'owner_id = ?, ';
      params.push(owner_id);
    }
    if (cleaner_id !== undefined) {
      updateSQL += 'cleaner_id = ?, ';
      params.push(cleaner_id);
    }

    updateSQL = updateSQL.slice(0, -2); // Remove trailing comma
    updateSQL += ' WHERE id = ?';
    params.push(userId);

    db.prepare(updateSQL).run(...params);
    res.json({ message: 'User updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== OWNERS ====================

app.get('/api/owners', authenticateToken, (req, res) => {
  try {
    let query = 'SELECT * FROM owners';
    let params = [];
    
    // Owners can only see their own data
    if (req.user.role === 'owner') {
      query += ' WHERE id = ?';
      params.push(req.user.ownerId);
    } else {
      query += ' ORDER BY name';
    }
    
    const owners = db.prepare(query).all(...params);
    res.json(owners);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/owners/:id', authenticateToken, (req, res) => {
  try {
    // Owners can only access their own data
    if (req.user.role === 'owner' && req.params.id != req.user.ownerId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const owner = db.prepare('SELECT * FROM owners WHERE id = ?').get(req.params.id);
    if (!owner) return res.status(404).json({ error: 'Owner not found' });
    res.json(owner);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/owners', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const { name, email, phone, address, postal_code, city, country, vat_number } = req.body;
    const result = db.prepare(`
      INSERT INTO owners (name, email, phone, address, postal_code, city, country, vat_number)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, email, phone, address, postal_code, city, country || 'Netherlands', vat_number);
    res.json({ id: result.lastInsertRowid, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/owners/:id', authenticateToken, (req, res) => {
  try {
    // Owners can only update their own data
    if (req.user.role === 'owner' && req.params.id != req.user.ownerId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { name, email, phone, address, postal_code, city, country, vat_number } = req.body;
    db.prepare(`
      UPDATE owners SET name = ?, email = ?, phone = ?, address = ?, postal_code = ?, city = ?, country = ?, vat_number = ?
      WHERE id = ?
    `).run(name, email, phone, address, postal_code, city, country, vat_number, req.params.id);
    res.json({ id: parseInt(req.params.id), ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/owners/:id', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    db.prepare('DELETE FROM owners WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== COST PROFILES ====================

app.get('/api/cost-profiles', authenticateToken, (req, res) => {
  try {
    const profiles = db.prepare('SELECT * FROM cost_profiles ORDER BY name').all();
    res.json(profiles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/cost-profiles', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const { name, base_price, dog_surcharge, description } = req.body;
    const result = db.prepare(`
      INSERT INTO cost_profiles (name, base_price, dog_surcharge, description)
      VALUES (?, ?, ?, ?)
    `).run(name, base_price, dog_surcharge, description);
    res.json({ id: result.lastInsertRowid, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/cost-profiles/:id', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const { name, base_price, dog_surcharge, description } = req.body;
    db.prepare(`
      UPDATE cost_profiles SET name = ?, base_price = ?, dog_surcharge = ?, description = ?
      WHERE id = ?
    `).run(name, base_price, dog_surcharge, description, req.params.id);
    res.json({ id: parseInt(req.params.id), ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/cost-profiles/:id', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    db.prepare('DELETE FROM cost_profiles WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== CLEANERS ====================

app.get('/api/cleaners', authenticateToken, (req, res) => {
  try {
    let query = 'SELECT * FROM cleaners WHERE is_active = 1';
    
    // Cleaners can only see themselves
    if (req.user.role === 'cleaner') {
      query += ' AND id = ?';
      const cleaners = db.prepare(query).all(req.user.cleanerId);
      return res.json(cleaners);
    }
    
    query += ' ORDER BY name';
    const cleaners = db.prepare(query).all();
    res.json(cleaners);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/cleaners', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const result = db.prepare(`
      INSERT INTO cleaners (name, email, phone)
      VALUES (?, ?, ?)
    `).run(name, email, phone);
    res.json({ id: result.lastInsertRowid, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/cleaners/:id', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const { name, email, phone, is_active } = req.body;
    db.prepare(`
      UPDATE cleaners SET name = ?, email = ?, phone = ?, is_active = ?
      WHERE id = ?
    `).run(name, email, phone, is_active, req.params.id);
    res.json({ id: parseInt(req.params.id), ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== HOUSES ====================

app.get('/api/houses', authenticateToken, (req, res) => {
  try {
    let query = `
      SELECT h.*, o.name as owner_name, cp.name as cost_profile_name, c.name as default_cleaner_name
      FROM houses h
      LEFT JOIN owners o ON h.owner_id = o.id
      LEFT JOIN cost_profiles cp ON h.cost_profile_id = cp.id
      LEFT JOIN cleaners c ON h.default_cleaner_id = c.id
    `;
    
    // Owners can only see their own houses
    if (req.user.role === 'owner') {
      query += ' WHERE h.owner_id = ?';
      const houses = db.prepare(query).all(req.user.ownerId);
      return res.json(houses);
    }
    
    query += ' ORDER BY h.name';
    const houses = db.prepare(query).all();
    res.json(houses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/houses/:id', authenticateToken, (req, res) => {
  try {
    const house = db.prepare(`
      SELECT h.*, o.name as owner_name, o.email as owner_email, o.phone as owner_phone, o.address as owner_address,
             cp.base_price, cp.dog_surcharge
      FROM houses h
      LEFT JOIN owners o ON h.owner_id = o.id
      LEFT JOIN cost_profiles cp ON h.cost_profile_id = cp.id
      WHERE h.id = ?
    `).get(req.params.id);
    
    if (!house) return res.status(404).json({ error: 'House not found' });
    
    // Owners can only access their own houses
    if (req.user.role === 'owner' && house.owner_id != req.user.ownerId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(house);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/houses', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const { name, address, owner_id, cost_profile_id, allows_dogs, number_of_rooms, square_footage, default_cleaner_id, notes } = req.body;
    const result = db.prepare(`
      INSERT INTO houses (name, address, owner_id, cost_profile_id, allows_dogs, number_of_rooms, square_footage, default_cleaner_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, address, owner_id, cost_profile_id, allows_dogs, number_of_rooms, square_footage, default_cleaner_id, notes);
    res.json({ id: result.lastInsertRowid, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/houses/:id', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const { name, address, owner_id, cost_profile_id, allows_dogs, number_of_rooms, square_footage, default_cleaner_id, notes } = req.body;
    db.prepare(`
      UPDATE houses SET name = ?, address = ?, owner_id = ?, cost_profile_id = ?, allows_dogs = ?, 
          number_of_rooms = ?, square_footage = ?, default_cleaner_id = ?, notes = ?
      WHERE id = ?
    `).run(name, address, owner_id, cost_profile_id, allows_dogs, number_of_rooms, square_footage, default_cleaner_id, notes, req.params.id);
    res.json({ id: parseInt(req.params.id), ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/houses/:id', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    db.prepare('DELETE FROM houses WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== BOOKINGS ====================

app.get('/api/bookings', authenticateToken, (req, res) => {
  try {
    let query = `
      SELECT b.*, h.name as house_name, h.address as house_address, h.allows_dogs, h.owner_id
      FROM bookings b
      LEFT JOIN houses h ON b.house_id = h.id
    `;
    
    // Owners can only see bookings for their own houses
    if (req.user.role === 'owner') {
      query += ' WHERE h.owner_id = ?';
      const bookings = db.prepare(query).all(req.user.ownerId);
      return res.json(bookings);
    }
    
    // Cleaners can only see bookings related to their assigned jobs
    if (req.user.role === 'cleaner') {
      query = `
        SELECT DISTINCT b.*, h.name as house_name, h.address as house_address, h.allows_dogs, h.owner_id
        FROM bookings b
        LEFT JOIN houses h ON b.house_id = h.id
        LEFT JOIN cleaning_jobs cj ON b.id = cj.booking_id
        WHERE cj.cleaner_id = ?
        ORDER BY b.checkin_datetime DESC
      `;
      const bookings = db.prepare(query).all(req.user.cleanerId);
      return res.json(bookings);
    }
    
    query += ' ORDER BY b.checkin_datetime DESC';
    const bookings = db.prepare(query).all();
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/bookings/house/:houseId', authenticateToken, (req, res) => {
  try {
    const house = db.prepare('SELECT owner_id FROM houses WHERE id = ?').get(req.params.houseId);
    if (!house) return res.status(404).json({ error: 'House not found' });
    
    // Owners can only access bookings for their own houses
    if (req.user.role === 'owner' && house.owner_id != req.user.ownerId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const bookings = db.prepare(`
      SELECT * FROM bookings WHERE house_id = ? ORDER BY checkin_datetime DESC
    `).all(req.params.houseId);
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bookings', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const { house_id, guest_name, guest_email, guest_phone, checkin_datetime, checkout_datetime, has_dogs, notes } = req.body;

    // Check for scheduling conflicts - same time checkin/checkout is not allowed
    const existingBookings = db.prepare(`
      SELECT * FROM bookings WHERE house_id = ? 
      AND (
        (checkin_datetime <= ? AND checkout_datetime >= ?) OR
        (checkin_datetime <= ? AND checkout_datetime >= ?)
      )
    `).all(house_id, checkout_datetime, checkout_datetime, checkin_datetime, checkin_datetime);

    if (existingBookings.length > 0) {
      throw new Error('Booking conflict: This house already has a booking that overlaps with the requested dates. Same-day transitions are allowed, but same-time checkin/checkout is not.');
    }

    const transaction = db.transaction(() => {
      // Insert booking
      const result = db.prepare(`
        INSERT INTO bookings (house_id, guest_name, guest_email, guest_phone, checkin_datetime, checkout_datetime, has_dogs, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(house_id, guest_name, guest_email, guest_phone, checkin_datetime, checkout_datetime, has_dogs || false, notes);

      const bookingId = result.lastInsertRowid;

      // Get house details for cleaning job
      const house = db.prepare(`
        SELECT h.*, cp.base_price, cp.dog_surcharge, h.default_cleaner_id, h.allows_dogs
        FROM houses h
        LEFT JOIN cost_profiles cp ON h.cost_profile_id = cp.id
        WHERE h.id = ?
      `).get(house_id);

      if (!house) throw new Error('House not found');

      // Auto-schedule cleaning job after checkout
      const scheduledDatetime = new Date(new Date(checkout_datetime).getTime() + 2 * 60 * 60 * 1000); // 2 hours after checkout
      const cleanerId = house.default_cleaner_id;

      if (!cleanerId) {
        throw new Error('No default cleaner assigned to this house');
      }

      // Check for cleaner schedule conflicts before auto-scheduling
      const estimatedEnd = new Date(scheduledDatetime.getTime() + 2 * 60 * 60 * 1000); // 2 hour cleaning duration
      
      const existingJobs = db.prepare(`
        SELECT * FROM cleaning_jobs WHERE cleaner_id = ? 
        AND status NOT IN ('cancelled', 'completed')
      `).all(cleanerId);
      
      const hasConflict = existingJobs.some(job => {
        const jobStart = new Date(job.scheduled_datetime);
        const jobEnd = new Date(jobStart.getTime() + 2 * 60 * 60 * 1000);
        return (scheduledDatetime < jobEnd && estimatedEnd > jobStart);
      });
      
      if (hasConflict) {
        throw new Error('Cleaner schedule conflict: The default cleaner is already busy at the scheduled time. Please assign a different cleaner or adjust the booking.');
      }

      const baseCost = house.base_price || 0;
      // Dog surcharge only applies if BOTH house allows dogs AND booking has dogs
      const dogSurcharge = (house.allows_dogs && has_dogs) ? (house.dog_surcharge || 0) : 0;
      const totalCost = baseCost + dogSurcharge;

      // Create cleaning job
      db.prepare(`
        INSERT INTO cleaning_jobs (house_id, booking_id, cleaner_id, scheduled_datetime, status, base_cost, dog_surcharge, total_cost)
        VALUES (?, ?, ?, ?, 'scheduled', ?, ?, ?)
      `).run(house_id, bookingId, cleanerId, scheduledDatetime.toISOString(), baseCost, dogSurcharge, totalCost);

      return { bookingId, cleaningJobScheduled: true };
    });

    const result = transaction();
    res.json({ id: result.bookingId, ...req.body, cleaningJobScheduled: result.cleaningJobScheduled });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/bookings/:id', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const { house_id, guest_name, guest_email, guest_phone, checkin_datetime, checkout_datetime, has_dogs, notes } = req.body;
    
    // Check for scheduling conflicts (excluding current booking)
    const existingBookings = db.prepare(`
      SELECT * FROM bookings WHERE house_id = ? AND id != ?
      AND (
        (checkin_datetime <= ? AND checkout_datetime >= ?) OR
        (checkin_datetime <= ? AND checkout_datetime >= ?)
      )
    `).all(house_id, req.params.id, checkout_datetime, checkout_datetime, checkin_datetime, checkin_datetime);

    if (existingBookings.length > 0) {
      throw new Error('Booking conflict: This house already has a booking that overlaps with the requested dates.');
    }
    
    db.prepare(`
      UPDATE bookings SET house_id = ?, guest_name = ?, guest_email = ?, guest_phone = ?, 
          checkin_datetime = ?, checkout_datetime = ?, has_dogs = ?, notes = ?
      WHERE id = ?
    `).run(house_id, guest_name, guest_email, guest_phone, checkin_datetime, checkout_datetime, has_dogs || false, notes, req.params.id);
    res.json({ id: parseInt(req.params.id), ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/bookings/:id', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    db.prepare('DELETE FROM bookings WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== CLEANING JOBS ====================

app.get('/api/cleaning-jobs', authenticateToken, (req, res) => {
  try {
    let query = `
      SELECT cj.*, h.name as house_name, h.address as house_address, h.allows_dogs, h.owner_id,
             cl.name as cleaner_name, b.guest_name, b.checkout_datetime
      FROM cleaning_jobs cj
      LEFT JOIN houses h ON cj.house_id = h.id
      LEFT JOIN cleaners cl ON cj.cleaner_id = cl.id
      LEFT JOIN bookings b ON cj.booking_id = b.id
    `;
    
    // Owners can only see jobs for their own houses
    if (req.user.role === 'owner') {
      query += ' WHERE h.owner_id = ?';
      const jobs = db.prepare(query).all(req.user.ownerId);
      return res.json(jobs);
    }
    
    // Cleaners can only see their own jobs
    if (req.user.role === 'cleaner') {
      query += ' WHERE cj.cleaner_id = ?';
      const jobs = db.prepare(query).all(req.user.cleanerId);
      return res.json(jobs);
    }
    
    query += ' ORDER BY cj.scheduled_datetime DESC';
    const jobs = db.prepare(query).all();
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/cleaning-jobs/pending', authenticateToken, (req, res) => {
  try {
    let query = `
      SELECT cj.*, h.name as house_name, h.address as house_address, h.owner_id,
             cl.name as cleaner_name
      FROM cleaning_jobs cj
      LEFT JOIN houses h ON cj.house_id = h.id
      LEFT JOIN cleaners cl ON cj.cleaner_id = cl.id
      WHERE cj.status IN ('pending', 'scheduled')
    `;
    
    // Owners can only see pending jobs for their own houses
    if (req.user.role === 'owner') {
      query += ' AND h.owner_id = ?';
      const jobs = db.prepare(query).all(req.user.ownerId);
      return res.json(jobs);
    }
    
    // Cleaners can only see their own pending jobs
    if (req.user.role === 'cleaner') {
      query += ' AND cj.cleaner_id = ?';
      const jobs = db.prepare(query).all(req.user.cleanerId);
      return res.json(jobs);
    }
    
    query += ' ORDER BY cj.scheduled_datetime';
    const jobs = db.prepare(query).all();
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/cleaning-jobs/:id', authenticateToken, (req, res) => {
  try {
    const job = db.prepare(`
      SELECT cj.*, h.name as house_name, h.address as house_address, h.allows_dogs, h.owner_id,
             cl.name as cleaner_name, cl.phone as cleaner_phone,
             b.guest_name, b.checkout_datetime,
             o.name as owner_name, o.email as owner_email, o.phone as owner_phone, o.address as owner_address
      FROM cleaning_jobs cj
      LEFT JOIN houses h ON cj.house_id = h.id
      LEFT JOIN cleaners cl ON cj.cleaner_id = cl.id
      LEFT JOIN bookings b ON cj.booking_id = b.id
      LEFT JOIN owners o ON h.owner_id = o.id
      WHERE cj.id = ?
    `).get(req.params.id);
    
    if (!job) return res.status(404).json({ error: 'Cleaning job not found' });
    
    // Owners can only access jobs for their own houses
    if (req.user.role === 'owner' && job.owner_id != req.user.ownerId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Cleaners can only access their own jobs
    if (req.user.role === 'cleaner' && job.cleaner_id != req.user.cleanerId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/cleaning-jobs', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const { house_id, booking_id, cleaner_id, scheduled_datetime, base_cost, dog_surcharge, extra_charges, extra_charges_description, notes } = req.body;
    
    // Estimate cleaning duration (2 hours default)
    const scheduledDate = new Date(scheduled_datetime);
    const estimatedEnd = new Date(scheduledDate.getTime() + 2 * 60 * 60 * 1000);
    
    // Check for cleaner schedule conflicts
    const allJobs = db.prepare(`
      SELECT * FROM cleaning_jobs WHERE cleaner_id = ? 
      AND status NOT IN ('cancelled', 'completed')
    `).all(cleaner_id);
    
    // Check for overlaps in JavaScript since SQLite doesn't support INTERVAL
    const hasConflict = allJobs.some(job => {
      const jobStart = new Date(job.scheduled_datetime);
      const jobEnd = new Date(jobStart.getTime() + 2 * 60 * 60 * 1000); // Assume 2 hour duration
      
      // Check if ranges overlap
      return (scheduledDate < jobEnd && estimatedEnd > jobStart);
    });
    
    if (hasConflict) {
      throw new Error('Cleaner schedule conflict: This cleaner already has a job scheduled during this time period.');
    }
    
    const totalCost = (base_cost || 0) + (dog_surcharge || 0) + (extra_charges || 0);
    
    const result = db.prepare(`
      INSERT INTO cleaning_jobs (house_id, booking_id, cleaner_id, scheduled_datetime, status, base_cost, dog_surcharge, extra_charges, extra_charges_description, total_cost, notes)
      VALUES (?, ?, ?, ?, 'scheduled', ?, ?, ?, ?, ?, ?)
    `).run(house_id, booking_id, cleaner_id, scheduled_datetime, base_cost, dog_surcharge, extra_charges, extra_charges_description, totalCost, notes);
    
    res.json({ id: result.lastInsertRowid, ...req.body, total_cost: totalCost });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/cleaning-jobs/:id', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const { house_id, booking_id, cleaner_id, scheduled_datetime, status, base_cost, dog_surcharge, extra_charges, extra_charges_description, notes } = req.body;
    
    const totalCost = (base_cost || 0) + (dog_surcharge || 0) + (extra_charges || 0);
    
    const completedAt = status === 'completed' ? new Date().toISOString() : null;
    
    db.prepare(`
      UPDATE cleaning_jobs SET house_id = ?, booking_id = ?, cleaner_id = ?, scheduled_datetime = ?, 
          status = ?, base_cost = ?, dog_surcharge = ?, extra_charges = ?, extra_charges_description = ?, 
          total_cost = ?, notes = ?, completed_at = ?
      WHERE id = ?
    `).run(house_id, booking_id, cleaner_id, scheduled_datetime, status, base_cost, dog_surcharge, 
          extra_charges, extra_charges_description, totalCost, notes, completedAt, req.params.id);
    
    res.json({ id: parseInt(req.params.id), ...req.body, total_cost: totalCost, completed_at: completedAt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/cleaning-jobs/:id/status', authenticateToken, (req, res) => {
  try {
    const { status } = req.body;
    
    // Cleaners can only update their own jobs
    if (req.user.role === 'cleaner') {
      const job = db.prepare('SELECT cleaner_id FROM cleaning_jobs WHERE id = ?').get(req.params.id);
      if (!job) return res.status(404).json({ error: 'Job not found' });
      if (job.cleaner_id != req.user.cleanerId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    
    const completedAt = status === 'completed' ? new Date().toISOString() : null;
    const startedAt = status === 'in_progress' ? new Date().toISOString() : null;
    
    let updateSQL = 'UPDATE cleaning_jobs SET status = ?';
    const params = [status];
    
    if (completedAt) {
      updateSQL += ', completed_at = ?';
      params.push(completedAt);
    }
    if (startedAt) {
      updateSQL += ', started_at = ?';
      params.push(startedAt);
    }
    
    updateSQL += ' WHERE id = ?';
    params.push(req.params.id);
    
    db.prepare(updateSQL).run(...params);
    
    res.json({ id: parseInt(req.params.id), status, completed_at: completedAt, started_at: startedAt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/cleaning-jobs/:id', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    db.prepare('DELETE FROM cleaning_jobs WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== INVOICES ====================

app.get('/api/invoices', authenticateToken, (req, res) => {
  try {
    let query = `
      SELECT i.*, h.name as house_name, cj.scheduled_datetime, cj.total_cost, h.owner_id
      FROM invoices i
      LEFT JOIN houses h ON i.house_id = h.id
      LEFT JOIN cleaning_jobs cj ON i.cleaning_job_id = cj.id
    `;
    
    // Owners can only see their own invoices
    if (req.user.role === 'owner') {
      query += ' WHERE h.owner_id = ?';
      const invoices = db.prepare(query).all(req.user.ownerId);
      return res.json(invoices);
    }
    
    query += ' ORDER BY i.generated_at DESC';
    const invoices = db.prepare(query).all();
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/invoices/:id', authenticateToken, (req, res) => {
  try {
    const invoice = db.prepare(`
      SELECT i.*, h.name as house_name, h.address as house_address, h.owner_id,
             o.name as owner_name, o.email as owner_email, o.phone as owner_phone, o.address as owner_address,
             cj.scheduled_datetime, cj.base_cost, cj.dog_surcharge, cj.extra_charges, cj.extra_charges_description, cj.total_cost,
             b.checkout_datetime as booking_checkout
      FROM invoices i
      LEFT JOIN houses h ON i.house_id = h.id
      LEFT JOIN owners o ON i.owner_id = o.id
      LEFT JOIN cleaning_jobs cj ON i.cleaning_job_id = cj.id
      LEFT JOIN bookings b ON cj.booking_id = b.id
      WHERE i.id = ?
    `).get(req.params.id);
    
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    
    // Owners can only access their own invoices
    if (req.user.role === 'owner' && invoice.owner_id != req.user.ownerId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/invoices/generate/:cleaningJobId', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const cleaningJobId = req.params.cleaningJobId;
    
    // Check if invoice already exists
    const existingInvoice = db.prepare('SELECT * FROM invoices WHERE cleaning_job_id = ?').get(cleaningJobId);
    if (existingInvoice) {
      return res.status(400).json({ error: 'Invoice already exists for this cleaning job' });
    }
    
    // Get cleaning job details with all related info
    const job = db.prepare(`
      SELECT cj.*, h.name as house_name, h.address as house_address, h.owner_id, h.allows_dogs,
             o.name as owner_name, o.email as owner_email, o.phone as owner_phone, o.address as owner_address,
             b.checkout_datetime as booking_checkout
      FROM cleaning_jobs cj
      LEFT JOIN houses h ON cj.house_id = h.id
      LEFT JOIN owners o ON h.owner_id = o.id
      LEFT JOIN bookings b ON cj.booking_id = b.id
      WHERE cj.id = ?
    `).get(cleaningJobId);
    
    if (!job) return res.status(404).json({ error: 'Cleaning job not found' });
    
    const invoiceNumber = generateInvoiceNumber();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // 30 days from now
    
    // Insert invoice
    const result = db.prepare(`
      INSERT INTO invoices (cleaning_job_id, invoice_number, owner_id, house_id, amount, status, due_date)
      VALUES (?, ?, ?, ?, ?, 'draft', ?)
    `).run(cleaningJobId, invoiceNumber, job.owner_id, job.house_id, job.total_cost, dueDate.toISOString());
    
    const invoiceId = result.lastInsertRowid;
    
    // Generate PDF
    const pdfData = {
      invoice_number: invoiceNumber,
      generated_at: new Date().toISOString(),
      due_date: dueDate.toISOString(),
      owner_name: job.owner_name,
      owner_email: job.owner_email,
      owner_phone: job.owner_phone,
      owner_address: job.owner_address,
      house_name: job.house_name,
      house_address: job.house_address,
      scheduled_datetime: job.scheduled_datetime,
      booking_checkout: job.booking_checkout,
      base_cost: job.base_cost,
      dog_surcharge: job.dog_surcharge,
      extra_charges: job.extra_charges,
      extra_charges_description: job.extra_charges_description,
      amount: job.total_cost,
      notes: job.notes
    };
    
    const pdfResult = await generateInvoicePDF(pdfData);
    
    // Update invoice with PDF path
    db.prepare('UPDATE invoices SET pdf_path = ? WHERE id = ?').run(pdfResult.filepath, invoiceId);
    
    // Get the complete invoice record
    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId);
    
    res.json({ ...invoice, pdf_url: `/invoices/${pdfResult.filename}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/invoices/:id', (req, res) => {
  try {
    const { status, notes } = req.body;
    db.prepare(`
      UPDATE invoices SET status = ?, notes = ?
      WHERE id = ?
    `).run(status, notes, req.params.id);
    res.json({ id: parseInt(req.params.id), ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/invoices/:id', (req, res) => {
  try {
    const invoice = db.prepare('SELECT pdf_path FROM invoices WHERE id = ?').get(req.params.id);
    if (invoice && invoice.pdf_path) {
      const fs = require('fs');
      if (fs.existsSync(invoice.pdf_path)) {
        fs.unlinkSync(invoice.pdf_path);
      }
    }
    db.prepare('DELETE FROM invoices WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== DASHBOARD STATS ====================

app.get('/api/dashboard/stats', (req, res) => {
  try {
    const stats = {
      totalHouses: db.prepare('SELECT COUNT(*) as count FROM houses').get().count,
      totalCleaners: db.prepare('SELECT COUNT(*) as count FROM cleaners WHERE is_active = 1').get().count,
      pendingJobs: db.prepare("SELECT COUNT(*) as count FROM cleaning_jobs WHERE status IN ('pending', 'scheduled')").get().count,
      completedJobsThisMonth: db.prepare(`
        SELECT COUNT(*) as count FROM cleaning_jobs 
        WHERE status = 'completed' AND strftime('%Y-%m', completed_at) = strftime('%Y-%m', 'now')
      `).get().count,
      pendingInvoices: db.prepare("SELECT COUNT(*) as count FROM invoices WHERE status = 'pending'").get().count,
      totalRevenueThisMonth: db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total FROM invoices 
        WHERE status = 'paid' AND strftime('%Y-%m', generated_at) = strftime('%Y-%m', 'now')
      `).get().total
    };
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

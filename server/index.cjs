const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');
const { generateInvoicePDF } = require('./pdf-generator');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/invoices', express.static(path.join(__dirname, '..', 'invoices')));

// Helper function to generate invoice number
function generateInvoiceNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const result = db.prepare('SELECT COUNT(*) as count FROM invoices').get();
  const seq = String(result.count + 1).padStart(4, '0');
  return `INV-${year}${month}-${seq}`;
}

// ==================== OWNERS ====================

app.get('/api/owners', (req, res) => {
  try {
    const owners = db.prepare('SELECT * FROM owners ORDER BY name').all();
    res.json(owners);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/owners/:id', (req, res) => {
  try {
    const owner = db.prepare('SELECT * FROM owners WHERE id = ?').get(req.params.id);
    if (!owner) return res.status(404).json({ error: 'Owner not found' });
    res.json(owner);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/owners', (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    const result = db.prepare(`
      INSERT INTO owners (name, email, phone, address)
      VALUES (?, ?, ?, ?)
    `).run(name, email, phone, address);
    res.json({ id: result.lastInsertRowid, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/owners/:id', (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    db.prepare(`
      UPDATE owners SET name = ?, email = ?, phone = ?, address = ?
      WHERE id = ?
    `).run(name, email, phone, address, req.params.id);
    res.json({ id: parseInt(req.params.id), ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/owners/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM owners WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== COST PROFILES ====================

app.get('/api/cost-profiles', (req, res) => {
  try {
    const profiles = db.prepare('SELECT * FROM cost_profiles ORDER BY name').all();
    res.json(profiles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/cost-profiles', (req, res) => {
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

app.put('/api/cost-profiles/:id', (req, res) => {
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

app.delete('/api/cost-profiles/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM cost_profiles WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== CLEANERS ====================

app.get('/api/cleaners', (req, res) => {
  try {
    const cleaners = db.prepare('SELECT * FROM cleaners WHERE is_active = 1 ORDER BY name').all();
    res.json(cleaners);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/cleaners', (req, res) => {
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

app.put('/api/cleaners/:id', (req, res) => {
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

app.get('/api/houses', (req, res) => {
  try {
    const houses = db.prepare(`
      SELECT h.*, o.name as owner_name, cp.name as cost_profile_name, c.name as default_cleaner_name
      FROM houses h
      LEFT JOIN owners o ON h.owner_id = o.id
      LEFT JOIN cost_profiles cp ON h.cost_profile_id = cp.id
      LEFT JOIN cleaners c ON h.default_cleaner_id = c.id
      ORDER BY h.name
    `).all();
    res.json(houses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/houses/:id', (req, res) => {
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
    res.json(house);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/houses', (req, res) => {
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

app.put('/api/houses/:id', (req, res) => {
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

app.delete('/api/houses/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM houses WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== BOOKINGS ====================

app.get('/api/bookings', (req, res) => {
  try {
    const bookings = db.prepare(`
      SELECT b.*, h.name as house_name, h.address as house_address, h.allows_dogs
      FROM bookings b
      LEFT JOIN houses h ON b.house_id = h.id
      ORDER BY b.checkin_datetime DESC
    `).all();
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/bookings/house/:houseId', (req, res) => {
  try {
    const bookings = db.prepare(`
      SELECT * FROM bookings WHERE house_id = ? ORDER BY checkin_datetime DESC
    `).all(req.params.houseId);
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bookings', (req, res) => {
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
  }
});

app.put('/api/bookings/:id', (req, res) => {
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
  }
});

app.delete('/api/bookings/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM bookings WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== CLEANING JOBS ====================

app.get('/api/cleaning-jobs', (req, res) => {
  try {
    const jobs = db.prepare(`
      SELECT cj.*, h.name as house_name, h.address as house_address, h.allows_dogs,
             cl.name as cleaner_name, b.guest_name, b.checkout_datetime
      FROM cleaning_jobs cj
      LEFT JOIN houses h ON cj.house_id = h.id
      LEFT JOIN cleaners cl ON cj.cleaner_id = cl.id
      LEFT JOIN bookings b ON cj.booking_id = b.id
      ORDER BY cj.scheduled_datetime DESC
    `).all();
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/cleaning-jobs/pending', (req, res) => {
  try {
    const jobs = db.prepare(`
      SELECT cj.*, h.name as house_name, h.address as house_address,
             cl.name as cleaner_name
      FROM cleaning_jobs cj
      LEFT JOIN houses h ON cj.house_id = h.id
      LEFT JOIN cleaners cl ON cj.cleaner_id = cl.id
      WHERE cj.status IN ('pending', 'scheduled')
      ORDER BY cj.scheduled_datetime
    `).all();
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/cleaning-jobs/:id', (req, res) => {
  try {
    const job = db.prepare(`
      SELECT cj.*, h.name as house_name, h.address as house_address, h.allows_dogs,
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
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/cleaning-jobs', (req, res) => {
  try {
    const { house_id, booking_id, cleaner_id, scheduled_datetime, base_cost, dog_surcharge, extra_charges, extra_charges_description, notes } = req.body;
    
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

app.put('/api/cleaning-jobs/:id', (req, res) => {
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

app.patch('/api/cleaning-jobs/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    const completedAt = status === 'completed' ? new Date().toISOString() : null;
    
    db.prepare(`
      UPDATE cleaning_jobs SET status = ?, completed_at = ?
      WHERE id = ?
    `).run(status, completedAt, req.params.id);
    
    res.json({ id: parseInt(req.params.id), status, completed_at: completedAt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/cleaning-jobs/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM cleaning_jobs WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== INVOICES ====================

app.get('/api/invoices', (req, res) => {
  try {
    const invoices = db.prepare(`
      SELECT i.*, h.name as house_name, cj.scheduled_datetime, cj.total_cost
      FROM invoices i
      LEFT JOIN houses h ON i.house_id = h.id
      LEFT JOIN cleaning_jobs cj ON i.cleaning_job_id = cj.id
      ORDER BY i.generated_at DESC
    `).all();
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/invoices/:id', (req, res) => {
  try {
    const invoice = db.prepare(`
      SELECT i.*, h.name as house_name, h.address as house_address,
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
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/invoices/generate/:cleaningJobId', (req, res) => {
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
      VALUES (?, ?, ?, ?, ?, 'pending', ?)
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

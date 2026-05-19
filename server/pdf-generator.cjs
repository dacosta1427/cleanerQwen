const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const invoicesDir = path.join(__dirname, '..', 'invoices');
if (!fs.existsSync(invoicesDir)) {
  fs.mkdirSync(invoicesDir, { recursive: true });
}

function generateInvoicePDF(invoiceData) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const filename = `invoice_${invoiceData.invoice_number}.pdf`;
    const filepath = path.join(invoicesDir, filename);
    
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // Header
    doc.fontSize(24).text('INVOICE', { align: 'center' });
    doc.moveDown();
    
    // Company info (placeholder - can be customized)
    doc.fontSize(12).text('Cleaning Scheduler Company', { align: 'left' });
    doc.text('123 Clean Street');
    doc.text('City, State 12345');
    doc.text('Phone: (555) 123-4567');
    doc.text('Email: billing@cleaningscheduler.com');
    doc.moveDown();

    // Invoice details
    doc.fontSize(14).text(`Invoice Number: ${invoiceData.invoice_number}`, { align: 'right' });
    doc.text(`Date: ${new Date(invoiceData.generated_at).toLocaleDateString()}`, { align: 'right' });
    if (invoiceData.due_date) {
      doc.text(`Due Date: ${new Date(invoiceData.due_date).toLocaleDateString()}`, { align: 'right' });
    }
    doc.moveDown(2);

    // Bill To
    doc.fontSize(14).text('Bill To:');
    doc.fontSize(12).text(invoiceData.owner_name || 'Property Owner');
    if (invoiceData.owner_address) {
      doc.text(invoiceData.owner_address);
    }
    if (invoiceData.owner_email) {
      doc.text(`Email: ${invoiceData.owner_email}`);
    }
    if (invoiceData.owner_phone) {
      doc.text(`Phone: ${invoiceData.owner_phone}`);
    }
    doc.moveDown(2);

    // Property Info
    doc.fontSize(14).text('Property Cleaned:');
    doc.fontSize(12).text(invoiceData.house_name);
    doc.text(invoiceData.house_address);
    doc.moveDown();

    // Cleaning Job Details
    doc.fontSize(14).text('Cleaning Details:');
    doc.fontSize(12).text(`Service Date: ${new Date(invoiceData.scheduled_datetime).toLocaleDateString()}`);
    if (invoiceData.booking_info) {
      doc.text(`Booking Check-out: ${new Date(invoiceData.booking_checkout).toLocaleDateString()}`);
    }
    doc.moveDown();

    // Line items table
    let yPosition = doc.y;
    
    // Table header
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Description', 50, yPosition, { width: 300, align: 'left' });
    doc.text('Amount', 450, yPosition, { width: 100, align: 'right' });
    yPosition += 25;
    
    // Draw line
    doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
    yPosition += 15;
    
    // Line items
    doc.font('Helvetica');
    
    // Base cleaning cost
    doc.text('Base Cleaning Service', 50, yPosition, { width: 300, align: 'left' });
    doc.text(`$${invoiceData.base_cost.toFixed(2)}`, 450, yPosition, { width: 100, align: 'right' });
    yPosition += 20;
    
    // Dog surcharge if applicable
    if (invoiceData.dog_surcharge > 0) {
      doc.text('Dog Surcharge', 50, yPosition, { width: 300, align: 'left' });
      doc.text(`$${invoiceData.dog_surcharge.toFixed(2)}`, 450, yPosition, { width: 100, align: 'right' });
      yPosition += 20;
    }
    
    // Extra charges if any
    if (invoiceData.extra_charges > 0) {
      const description = invoiceData.extra_charges_description || 'Extra Services';
      doc.text(description, 50, yPosition, { width: 300, align: 'left' });
      doc.text(`$${invoiceData.extra_charges.toFixed(2)}`, 450, yPosition, { width: 100, align: 'right' });
      yPosition += 20;
    }
    
    // Draw line before total
    yPosition += 10;
    doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
    yPosition += 15;
    
    // Total
    doc.font('Helvetica-Bold').fontSize(14);
    doc.text('TOTAL', 50, yPosition, { width: 300, align: 'left' });
    doc.text(`$${invoiceData.amount.toFixed(2)}`, 450, yPosition, { width: 100, align: 'right' });
    yPosition += 40;
    
    // Notes section
    if (invoiceData.notes) {
      doc.font('Helvetica').fontSize(12);
      doc.text('Notes:', 50, yPosition);
      yPosition += 15;
      doc.text(invoiceData.notes, 50, yPosition, { width: 500 });
      yPosition += 60;
    } else {
      yPosition += 40;
    }
    
    // Payment instructions
    doc.fontSize(12).text('Payment Instructions:', 50, yPosition);
    yPosition += 15;
    doc.fontSize(10).text('Please make payment within 30 days of invoice date.', 50, yPosition, { width: 500 });
    yPosition += 15;
    doc.text('Thank you for your business!', 50, yPosition);

    // Footer
    const pageCount = doc.pageCount;
    for (let i = 1; i <= pageCount; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).text(`Page ${i} of ${pageCount}`, 500, 780, { align: 'right' });
    }

    doc.end();

    stream.on('finish', () => {
      resolve({ filename, filepath });
    });

    stream.on('error', (err) => {
      reject(err);
    });
  });
}

module.exports = { generateInvoicePDF };

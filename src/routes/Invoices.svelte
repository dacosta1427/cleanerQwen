<script>
  import { onMount } from 'svelte';
  import { api } from '$lib/api';

  let invoices = $state([]);
  
  onMount(async () => {
    await loadInvoices();
  });

  async function loadInvoices() {
    try {
      invoices = await api.getInvoices();
    } catch (err) {
      console.error('Failed to load invoices:', err);
    }
  }

  async function updateStatus(invoiceId, newStatus) {
    try {
      await api.updateInvoice(invoiceId, { status: newStatus });
      await loadInvoices();
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update status: ' + err.message);
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
  }

  function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  }

  function getStatusClass(status) {
    return `status-badge status-${status}`;
  }
</script>

<div class="invoices-page">
  <h1>Invoices</h1>

  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th>Invoice #</th>
          <th>House</th>
          <th>Amount</th>
          <th>Date</th>
          <th>Due Date</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each invoices as invoice (invoice.id)}
          <tr>
            <td class="invoice-number">{invoice.invoice_number}</td>
            <td>{invoice.house_name || '-'}</td>
            <td class="amount">${invoice.amount?.toFixed(2) || '0.00'}</td>
            <td>{formatDate(invoice.generated_at)}</td>
            <td>{formatDate(invoice.due_date)}</td>
            <td><span class={getStatusClass(invoice.status)}>{invoice.status}</span></td>
            <td class="actions">
              <select 
                value={invoice.status} 
                onchange={(e) => updateStatus(invoice.id, e.target.value)}
                class="status-select"
              >
                <option value="pending">Pending</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
              {#if invoice.pdf_path}
                <a href={`/invoices/${invoice.pdf_path.split('/').pop()}`} target="_blank" class="btn btn-small">View PDF</a>
              {/if}
            </td>
          </tr>
        {/each}
        {#if invoices.length === 0}
          <tr>
            <td colspan="7" class="empty-state">No invoices found. Generate an invoice from a completed cleaning job.</td>
          </tr>
        {/if}
      </tbody>
    </table>
  </div>
</div>

<style>
  .invoices-page { padding: 2rem; }
  h1 { color: #333; margin-bottom: 2rem; }
  .table-container { background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 1rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
  th { background: #f9fafb; font-weight: 600; color: #374151; }
  tr:hover { background: #f9fafb; }
  .actions { white-space: nowrap; }
  .empty-state { text-align: center; color: #6b7280; padding: 2rem !important; }
  .invoice-number { font-family: monospace; font-size: 0.9rem; color: #6b7280; }
  .amount { font-weight: 600; color: #16a34a; }
  .status-badge { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem; font-weight: 500; }
  .status-pending { background: #fef3c7; color: #92400e; }
  .status-sent { background: #dbeafe; color: #1e40af; }
  .status-paid { background: #dcfce7; color: #166534; }
  .status-overdue { background: #fee2e2; color: #991b1b; }
  .status-select { padding: 0.25rem; font-size: 0.8rem; border: 1px solid #d1d5db; border-radius: 4px; margin-right: 0.5rem; }
  .btn { padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem; text-decoration: none; display: inline-block; }
  .btn-small { padding: 0.25rem 0.5rem; font-size: 0.8rem; background: #2563eb; color: white; }
</style>

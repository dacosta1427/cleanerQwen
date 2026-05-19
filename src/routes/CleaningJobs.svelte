<script>
  import { onMount } from 'svelte';
  import { api } from '$lib/api';

  let cleaningJobs = $state([]);
  let houses = $state([]);
  let cleaners = $state([]);
  let showForm = $state(false);
  let editingJob = $state(null);
  let selectedJobForInvoice = $state(null);
  
  let formData = $state({
    house_id: '',
    cleaner_id: '',
    scheduled_datetime: '',
    base_cost: '',
    dog_surcharge: 0,
    extra_charges: 0,
    extra_charges_description: '',
    notes: ''
  });

  onMount(async () => {
    await loadData();
  });

  async function loadData() {
    try {
      [cleaningJobs, houses, cleaners] = await Promise.all([
        api.getCleaningJobs(),
        api.getHouses(),
        api.getCleaners()
      ]);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  }

  function openCreateForm() {
    editingJob = null;
    const now = new Date();
    now.setHours(now.getHours() + 2);
    formData = {
      house_id: houses[0]?.id || '',
      cleaner_id: '',
      scheduled_datetime: now.toISOString().slice(0, 16),
      base_cost: '',
      dog_surcharge: 0,
      extra_charges: 0,
      extra_charges_description: '',
      notes: ''
    };
    showForm = true;
  }

  function openEditForm(job) {
    editingJob = job;
    formData = {
      ...job,
      scheduled_datetime: job.scheduled_datetime?.slice(0, 16) || ''
    };
    showForm = true;
  }

  function closeForm() {
    showForm = false;
    editingJob = null;
  }

  function updateBaseCost() {
    const house = houses.find(h => h.id == formData.house_id);
    if (house) {
      formData.base_cost = house.base_price || 0;
      formData.dog_surcharge = house.allows_dogs ? (house.dog_surcharge || 0) : 0;
    }
  }

  async function handleSubmit() {
    try {
      const data = {
        ...formData,
        house_id: parseInt(formData.house_id),
        cleaner_id: parseInt(formData.cleaner_id),
        base_cost: parseFloat(formData.base_cost) || 0,
        dog_surcharge: parseFloat(formData.dog_surcharge) || 0,
        extra_charges: parseFloat(formData.extra_charges) || 0
      };
      
      if (editingJob) {
        await api.updateCleaningJob(editingJob.id, data);
      } else {
        await api.createCleaningJob(data);
      }
      closeForm();
      await loadData();
    } catch (err) {
      console.error('Failed to save cleaning job:', err);
      alert('Failed to save cleaning job: ' + err.message);
    }
  }

  async function updateStatus(jobId, newStatus) {
    try {
      await api.updateCleaningJobStatus(jobId, newStatus);
      await loadData();
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update status: ' + err.message);
    }
  }

  async function generateInvoice(jobId) {
    try {
      const invoice = await api.generateInvoice(jobId);
      selectedJobForInvoice = null;
      // Open PDF in new tab
      window.open(invoice.pdf_url, '_blank');
      await loadData();
    } catch (err) {
      console.error('Failed to generate invoice:', err);
      alert('Failed to generate invoice: ' + err.message);
    }
  }

  function getStatusClass(status) {
    return `status-badge status-${status}`;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  }
</script>

<div class="jobs-page">
  <div class="header">
    <h1>Cleaning Jobs</h1>
    <button class="btn btn-primary" onclick={openCreateForm}>+ Add Job</button>
  </div>

  {#if showForm}
    <div class="modal-overlay" onclick={closeForm}>
      <div class="modal modal-large" onclick={(e) => e.stopPropagation()}>
        <h2>{editingJob ? 'Edit Cleaning Job' : 'Add New Cleaning Job'}</h2>
        <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <div class="form-row">
            <div class="form-group">
              <label>House *</label>
              <select bind:value={formData.house_id} required onchange={updateBaseCost}>
                {#each houses as house}
                  <option value={house.id}>{house.name}</option>
                {/each}
              </select>
            </div>
            <div class="form-group">
              <label>Cleaner *</label>
              <select bind:value={formData.cleaner_id} required>
                {#each cleaners as cleaner}
                  <option value={cleaner.id}>{cleaner.name}</option>
                {/each}
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Scheduled Date/Time *</label>
            <input type="datetime-local" bind:value={formData.scheduled_datetime} required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Base Cost</label>
              <input type="number" step="0.01" bind:value={formData.base_cost} />
            </div>
            <div class="form-group">
              <label>Dog Surcharge</label>
              <input type="number" step="0.01" bind:value={formData.dog_surcharge} readonly />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Extra Charges</label>
              <input type="number" step="0.01" bind:value={formData.extra_charges} />
            </div>
            <div class="form-group">
              <label>Total: ${(parseFloat(formData.base_cost || 0) + parseFloat(formData.dog_surcharge || 0) + parseFloat(formData.extra_charges || 0)).toFixed(2)}</label>
            </div>
          </div>
          <div class="form-group">
            <label>Extra Charges Description</label>
            <input type="text" bind:value={formData.extra_charges_description} placeholder="e.g., Replaced broken item" />
          </div>
          <div class="form-group">
            <label>Notes</label>
            <textarea bind:value={formData.notes} rows="3"></textarea>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick={closeForm}>Cancel</button>
            <button type="submit" class="btn btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  {#if selectedJobForInvoice}
    <div class="modal-overlay" onclick={() => selectedJobForInvoice = null}>
      <div class="modal" onclick={(e) => e.stopPropagation()}>
        <h2>Generate Invoice</h2>
        <p>Generate an invoice for this cleaning job?</p>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick={() => selectedJobForInvoice = null}>Cancel</button>
          <button type="button" class="btn btn-primary" onclick={() => generateInvoice(selectedJobForInvoice)}>Generate PDF</button>
        </div>
      </div>
    </div>
  {/if}

  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th>House</th>
          <th>Cleaner</th>
          <th>Scheduled</th>
          <th>Status</th>
          <th>Total Cost</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each cleaningJobs as job (job.id)}
          <tr>
            <td>{job.house_name}</td>
            <td>{job.cleaner_name || '-'}</td>
            <td>{formatDate(job.scheduled_datetime)}</td>
            <td><span class={getStatusClass(job.status)}>{job.status}</span></td>
            <td>${job.total_cost?.toFixed(2) || '0.00'}</td>
            <td class="actions">
              <select 
                value={job.status} 
                onchange={(e) => updateStatus(job.id, e.target.value)}
                class="status-select"
              >
                <option value="pending">Pending</option>
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button class="btn btn-small" onclick={() => openEditForm(job)}>Edit</button>
              {#if job.status === 'completed'}
                <button class="btn btn-small btn-success" onclick={() => selectedJobForInvoice = job.id}>Invoice</button>
              {/if}
            </td>
          </tr>
        {/each}
        {#if cleaningJobs.length === 0}
          <tr>
            <td colspan="6" class="empty-state">No cleaning jobs found.</td>
          </tr>
        {/if}
      </tbody>
    </table>
  </div>
</div>

<style>
  .jobs-page { padding: 2rem; }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
  h1 { color: #333; }
  .btn { padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem; }
  .btn-primary { background: #2563eb; color: white; }
  .btn-primary:hover { background: #1d4ed8; }
  .btn-secondary { background: #6b7280; color: white; }
  .btn-success { background: #16a34a; color: white; }
  .btn-small { padding: 0.25rem 0.5rem; font-size: 0.8rem; margin-right: 0.5rem; }
  .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
  .modal { background: white; padding: 2rem; border-radius: 8px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; }
  .modal-large { max-width: 700px; }
  .modal h2 { margin-top: 0; margin-bottom: 1.5rem; }
  .form-group { margin-bottom: 1rem; }
  .form-group label { display: block; margin-bottom: 0.25rem; font-weight: 500; color: #374151; }
  .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px; font-size: 1rem; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .form-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.5rem; }
  .table-container { background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 1rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
  th { background: #f9fafb; font-weight: 600; color: #374151; }
  tr:hover { background: #f9fafb; }
  .actions { white-space: nowrap; }
  .empty-state { text-align: center; color: #6b7280; padding: 2rem !important; }
  .status-badge { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem; font-weight: 500; }
  .status-pending { background: #fef3c7; color: #92400e; }
  .status-scheduled { background: #dbeafe; color: #1e40af; }
  .status-in_progress { background: #e0e7ff; color: #3730a3; }
  .status-completed { background: #dcfce7; color: #166534; }
  .status-cancelled { background: #fee2e2; color: #991b1b; }
  .status-select { padding: 0.25rem; font-size: 0.8rem; border: 1px solid #d1d5db; border-radius: 4px; margin-right: 0.5rem; }
</style>

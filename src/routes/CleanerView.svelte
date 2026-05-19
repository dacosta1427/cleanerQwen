<script>
  import { onMount } from 'svelte';
  import { api } from '$lib/api';
  import { page } from '$app/stores';

  // Get cleaner ID from URL params or use a default for demo
  let cleanerId = $state(parseInt(page.params.cleanerId) || 1);
  let cleaningJobs = $state([]);
  let selectedJob = $state(null);
  let jobStatus = $state('pending'); // pending, in_progress, completed
  
  onMount(async () => {
    await loadJobs();
  });

  async function loadJobs() {
    try {
      const allJobs = await api.getCleaningJobs();
      // Filter jobs for this cleaner (or all pending/scheduled jobs if no cleaner assigned yet)
      cleaningJobs = allJobs.filter(job => 
        job.cleaner_id === cleanerId && 
        ['pending', 'scheduled', 'in_progress'].includes(job.status)
      ).sort((a, b) => new Date(a.scheduled_datetime) - new Date(b.scheduled_datetime));
    } catch (err) {
      console.error('Failed to load jobs:', err);
    }
  }

  function selectJob(job) {
    selectedJob = job;
    jobStatus = job.status;
  }

  function backToList() {
    selectedJob = null;
    jobStatus = 'pending';
  }

  async function startCleaning() {
    try {
      await api.updateCleaningJobStatus(selectedJob.id, 'in_progress');
      jobStatus = 'in_progress';
      selectedJob.status = 'in_progress';
      await loadJobs();
    } catch (err) {
      console.error('Failed to start cleaning:', err);
      alert('Failed to start cleaning: ' + err.message);
    }
  }

  async function finishCleaning() {
    try {
      // Prompt for extra charges
      const extraAmount = prompt('Enter any extra charges amount (or 0):', '0');
      if (extraAmount === null) return; // Cancelled
      
      const extraDescription = extraAmount > 0 
        ? prompt('Describe the extra charge:') 
        : '';
      
      const data = {
        ...selectedJob,
        status: 'completed',
        extra_charges: parseFloat(extraAmount) || 0,
        extra_charges_description: extraDescription
      };
      
      await api.updateCleaningJob(selectedJob.id, data);
      jobStatus = 'completed';
      selectedJob.status = 'completed';
      await loadJobs();
      backToList();
      alert('Cleaning completed! Invoice can now be generated.');
    } catch (err) {
      console.error('Failed to finish cleaning:', err);
      alert('Failed to finish cleaning: ' + err.message);
    }
  }

  function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  }

  function getStatusClass(status) {
    return `status-badge status-${status}`;
  }
</script>

<div class="cleaner-page">
  <div class="header">
    <h1>My Cleaning Schedule</h1>
    <p class="subtitle">Cleaner ID: {cleanerId}</p>
  </div>

  {#if selectedJob}
    <!-- Job Detail View with Start/Stop Buttons -->
    <div class="job-detail">
      <button class="btn btn-back" onclick={backToList}>← Back to List</button>
      
      <div class="job-card">
        <h2>{selectedJob.house_name}</h2>
        <p class="address">{selectedJob.house_address}</p>
        
        <div class="info-row">
          <strong>Scheduled:</strong> {formatDateTime(selectedJob.scheduled_datetime)}
        </div>
        <div class="info-row">
          <strong>Status:</strong> 
          <span class={getStatusClass(selectedJob.status)}>{selectedJob.status}</span>
        </div>
        {#if selectedJob.guest_name}
        <div class="info-row">
          <strong>Guest:</strong> {selectedJob.guest_name}
        </div>
        {/if}
        
        {#if selectedJob.allows_dogs}
        <div class="info-row dogs-warning">
          ⚠️ This house allows dogs - check if guest has dogs!
        </div>
        {/if}
      </div>

      <div class="action-buttons">
        {#if selectedJob.status === 'pending' || selectedJob.status === 'scheduled'}
          <button class="btn btn-start" onclick={startCleaning}>
            🟢 START CLEANING
          </button>
        {:else if selectedJob.status === 'in_progress'}
          <button class="btn btn-stop" onclick={finishCleaning}>
            🔴 FINISH CLEANING
          </button>
          <p class="status-message">Cleaning in progress...</p>
        {:else if selectedJob.status === 'completed'}
          <p class="status-message completed">✓ Cleaning completed!</p>
        {/if}
      </div>

      <div class="owner-notification-info">
        <p>📧 When you start/finish, the cleaning boss and owner will be notified.</p>
      </div>
    </div>
  {:else}
    <!-- Job List View -->
    <div class="job-list">
      {#if cleaningJobs.length === 0}
        <div class="empty-state">
          <p>No upcoming cleaning jobs scheduled.</p>
        </div>
      {:else}
        {#each cleaningJobs as job (job.id)}
          <div class="job-item" onclick={() => selectJob(job)}>
            <div class="job-header">
              <h3>{job.house_name}</h3>
              <span class={getStatusClass(job.status)}>{job.status}</span>
            </div>
            <p class="job-address">{job.house_address}</p>
            <p class="job-time">📅 {formatDateTime(job.scheduled_datetime)}</p>
            <button class="btn btn-view">View Details →</button>
          </div>
        {/each}
      {/if}
    </div>
  {/if}
</div>

<style>
  .cleaner-page { 
    padding: 1rem; 
    max-width: 500px;
    margin: 0 auto;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  .header { 
    text-align: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }
  
  h1 { 
    color: #1f2937; 
    font-size: 1.5rem;
    margin: 0;
  }
  
  .subtitle {
    color: #6b7280;
    font-size: 0.9rem;
    margin: 0.25rem 0 0 0;
  }
  
  .btn { 
    padding: 0.75rem 1.5rem; 
    border: none; 
    border-radius: 8px; 
    cursor: pointer; 
    font-size: 1rem; 
    font-weight: 600;
    transition: all 0.2s;
  }
  
  .btn-back {
    background: #f3f4f6;
    color: #374151;
    margin-bottom: 1rem;
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }
  
  .btn-view {
    background: #2563eb;
    color: white;
    margin-top: 0.5rem;
    width: 100%;
  }
  
  .btn-start {
    background: #16a34a;
    color: white;
    font-size: 1.25rem;
    padding: 1.5rem 2rem;
    width: 100%;
    animation: pulse-green 2s infinite;
  }
  
  .btn-start:hover {
    background: #15803d;
  }
  
  .btn-stop {
    background: #dc2626;
    color: white;
    font-size: 1.25rem;
    padding: 1.5rem 2rem;
    width: 100%;
    animation: pulse-red 2s infinite;
  }
  
  .btn-stop:hover {
    background: #b91c1c;
  }
  
  @keyframes pulse-green {
    0%, 100% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.4); }
    50% { box-shadow: 0 0 0 15px rgba(22, 163, 74, 0); }
  }
  
  @keyframes pulse-red {
    0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); }
    50% { box-shadow: 0 0 0 15px rgba(220, 38, 38, 0); }
  }
  
  .job-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    margin-bottom: 1.5rem;
  }
  
  .job-card h2 {
    margin: 0 0 0.5rem 0;
    color: #1f2937;
  }
  
  .address {
    color: #6b7280;
    margin: 0 0 1rem 0;
  }
  
  .info-row {
    padding: 0.5rem 0;
    border-bottom: 1px solid #f3f4f6;
  }
  
  .info-row:last-child {
    border-bottom: none;
  }
  
  .dogs-warning {
    background: #fef3c7;
    color: #92400e;
    padding: 0.75rem;
    border-radius: 6px;
    margin-top: 0.5rem;
  }
  
  .action-buttons {
    margin: 1.5rem 0;
  }
  
  .status-message {
    text-align: center;
    color: #6b7280;
    margin-top: 1rem;
    font-size: 1.1rem;
  }
  
  .status-message.completed {
    color: #16a34a;
    font-weight: 600;
  }
  
  .owner-notification-info {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 8px;
    padding: 1rem;
    margin-top: 1.5rem;
  }
  
  .owner-notification-info p {
    margin: 0;
    color: #1e40af;
    font-size: 0.9rem;
    text-align: center;
  }
  
  .job-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .job-item {
    background: white;
    border-radius: 12px;
    padding: 1rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  
  .job-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
  
  .job-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }
  
  .job-header h3 {
    margin: 0;
    color: #1f2937;
    font-size: 1.1rem;
  }
  
  .job-address {
    color: #6b7280;
    font-size: 0.9rem;
    margin: 0 0 0.5rem 0;
  }
  
  .job-time {
    color: #374151;
    font-size: 0.9rem;
    margin: 0 0 0.5rem 0;
  }
  
  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    color: #6b7280;
  }
  
  .status-badge { 
    padding: 0.25rem 0.75rem; 
    border-radius: 20px; 
    font-size: 0.75rem; 
    font-weight: 600; 
    text-transform: uppercase;
  }
  
  .status-pending { background: #fef3c7; color: #92400e; }
  .status-scheduled { background: #dbeafe; color: #1e40af; }
  .status-in_progress { background: #e0e7ff; color: #3730a3; }
  .status-completed { background: #dcfce7; color: #166534; }
  .status-cancelled { background: #fee2e2; color: #991b1b; }
</style>

<script>
  import { onMount } from 'svelte';
  import { api } from '$lib/api';

  let stats = $state({
    totalHouses: 0,
    totalCleaners: 0,
    pendingJobs: 0,
    completedJobsThisMonth: 0,
    pendingInvoices: 0,
    totalRevenueThisMonth: 0
  });

  onMount(async () => {
    try {
      stats = await api.getDashboardStats();
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    }
  });
</script>

<div class="dashboard">
  <h1>Dashboard</h1>
  
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value">{stats.totalHouses}</div>
      <div class="stat-label">Total Houses</div>
    </div>
    
    <div class="stat-card">
      <div class="stat-value">{stats.totalCleaners}</div>
      <div class="stat-label">Active Cleaners</div>
    </div>
    
    <div class="stat-card">
      <div class="stat-value">{stats.pendingJobs}</div>
      <div class="stat-label">Pending Jobs</div>
    </div>
    
    <div class="stat-card">
      <div class="stat-value">{stats.completedJobsThisMonth}</div>
      <div class="stat-label">Completed This Month</div>
    </div>
    
    <div class="stat-card">
      <div class="stat-value">{stats.pendingInvoices}</div>
      <div class="stat-label">Pending Invoices</div>
    </div>
    
    <div class="stat-card revenue">
      <div class="stat-value">${stats.totalRevenueThisMonth.toFixed(2)}</div>
      <div class="stat-label">Revenue This Month</div>
    </div>
  </div>
</div>

<style>
  .dashboard {
    padding: 2rem;
  }
  
  h1 {
    margin-bottom: 2rem;
    color: #333;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
  }
  
  .stat-card {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    text-align: center;
  }
  
  .stat-value {
    font-size: 2.5rem;
    font-weight: bold;
    color: #2563eb;
  }
  
  .stat-label {
    color: #666;
    margin-top: 0.5rem;
    font-size: 0.9rem;
  }
  
  .revenue .stat-value {
    color: #16a34a;
  }
</style>

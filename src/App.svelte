<script>
  import Dashboard from './routes/Dashboard.svelte';
  import Owners from './routes/Owners.svelte';
  import Houses from './routes/Houses.svelte';
  import Bookings from './routes/Bookings.svelte';
  import CleaningJobs from './routes/CleaningJobs.svelte';
  import Invoices from './routes/Invoices.svelte';
  import CleanerView from './routes/CleanerView.svelte';

  let currentView = $state('dashboard');

  const views = {
    dashboard: Dashboard,
    owners: Owners,
    houses: Houses,
    bookings: Bookings,
    cleaningJobs: CleaningJobs,
    invoices: Invoices,
    cleanerView: CleanerView
  };

  function navigate(view) {
    currentView = view;
  }
</script>

<div class="app">
  <aside class="sidebar">
    <div class="logo">
      <h1>Clean Scheduler</h1>
    </div>
    <nav>
      <a class={currentView === 'dashboard' ? 'active' : ''} onclick={() => navigate('dashboard')}>
        📊 Dashboard
      </a>
      <a class={currentView === 'owners' ? 'active' : ''} onclick={() => navigate('owners')}>
        👤 Owners
      </a>
      <a class={currentView === 'houses' ? 'active' : ''} onclick={() => navigate('houses')}>
        🏠 Houses
      </a>
      <a class={currentView === 'bookings' ? 'active' : ''} onclick={() => navigate('bookings')}>
        📅 Bookings
      </a>
      <a class={currentView === 'cleaningJobs' ? 'active' : ''} onclick={() => navigate('cleaningJobs')}>
        🧹 Cleaning Jobs
      </a>
      <a class={currentView === 'invoices' ? 'active' : ''} onclick={() => navigate('invoices')}>
        📄 Invoices
      </a>
      <hr style="border-color: #334155; margin: 1rem 0;" />
      <a class={currentView === 'cleanerView' ? 'active' : ''} onclick={() => navigate('cleanerView')}>
        🧼 Cleaner View (Mobile)
      </a>
    </nav>
  </aside>

  <main class="content">
    {#if currentView === 'dashboard'}
      <Dashboard />
    {:else if currentView === 'owners'}
      <Owners />
    {:else if currentView === 'houses'}
      <Houses />
    {:else if currentView === 'bookings'}
      <Bookings />
    {:else if currentView === 'cleaningJobs'}
      <CleaningJobs />
    {:else if currentView === 'invoices'}
      <Invoices />
    {:else if currentView === 'cleanerView'}
      <CleanerView />
    {/if}
  </main>
</div>

<style>
  .app {
    display: flex;
    min-height: 100vh;
    background: #f3f4f6;
  }

  .sidebar {
    width: 250px;
    background: #1e293b;
    color: white;
    padding: 1.5rem;
    position: fixed;
    height: 100vh;
    overflow-y: auto;
  }

  .logo h1 {
    font-size: 1.25rem;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #334155;
  }

  nav a {
    display: block;
    padding: 0.75rem 1rem;
    color: #94a3b8;
    text-decoration: none;
    border-radius: 6px;
    margin-bottom: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  nav a:hover {
    background: #334155;
    color: white;
  }

  nav a.active {
    background: #2563eb;
    color: white;
  }

  .content {
    flex: 1;
    margin-left: 250px;
    padding: 2rem;
  }
</style>

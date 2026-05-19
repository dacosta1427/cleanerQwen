<script>
  import { onMount } from 'svelte';
  import { api } from '$lib/api';

  let costProfiles = $state([]);
  let showForm = $state(false);
  let editingProfile = $state(null);
  
  let formData = $state({
    name: '',
    base_price: '',
    dog_surcharge: '',
    description: ''
  });

  onMount(async () => {
    await loadCostProfiles();
  });

  async function loadCostProfiles() {
    try {
      costProfiles = await api.getCostProfiles();
    } catch (err) {
      console.error('Failed to load cost profiles:', err);
    }
  }

  function openCreateForm() {
    editingProfile = null;
    formData = { name: '', base_price: '', dog_surcharge: '', description: '' };
    showForm = true;
  }

  function openEditForm(profile) {
    editingProfile = profile;
    formData = { ...profile };
    showForm = true;
  }

  function closeForm() {
    showForm = false;
    editingProfile = null;
  }

  async function handleSubmit() {
    try {
      const data = {
        ...formData,
        base_price: parseFloat(formData.base_price) || 0,
        dog_surcharge: parseFloat(formData.dog_surcharge) || 0
      };
      
      if (editingProfile) {
        await api.updateCostProfile(editingProfile.id, data);
      } else {
        await api.createCostProfile(data);
      }
      closeForm();
      await loadCostProfiles();
    } catch (err) {
      console.error('Failed to save cost profile:', err);
      alert('Failed to save cost profile: ' + err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this cost profile?')) return;
    try {
      await api.deleteCostProfile(id);
      await loadCostProfiles();
    } catch (err) {
      console.error('Failed to delete cost profile:', err);
      alert('Failed to delete cost profile: ' + err.message);
    }
  }
</script>

<div class="profiles-page">
  <div class="header">
    <h1>Cost Profiles</h1>
    <button class="btn btn-primary" onclick={openCreateForm}>+ Add Profile</button>
  </div>

  {#if showForm}
    <div class="modal-overlay" onclick={closeForm}>
      <div class="modal" onclick={(e) => e.stopPropagation()}>
        <h2>{editingProfile ? 'Edit Cost Profile' : 'Add New Cost Profile'}</h2>
        <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <div class="form-group">
            <label>Name *</label>
            <input type="text" bind:value={formData.name} required placeholder="e.g., Standard Cleaning, Deep Clean" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Base Price ($) *</label>
              <input type="number" step="0.01" bind:value={formData.base_price} required />
            </div>
            <div class="form-group">
              <label>Dog Surcharge ($)</label>
              <input type="number" step="0.01" bind:value={formData.dog_surcharge} />
            </div>
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea bind:value={formData.description} rows="3"></textarea>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick={closeForm}>Cancel</button>
            <button type="submit" class="btn btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  <div class="cards-grid">
    {#each costProfiles as profile (profile.id)}
      <div class="card">
        <div class="card-header">
          <h3>{profile.name}</h3>
          <div class="card-actions">
            <button class="btn btn-small" onclick={() => openEditForm(profile)}>Edit</button>
            <button class="btn btn-small btn-danger" onclick={() => handleDelete(profile.id)}>Delete</button>
          </div>
        </div>
        <div class="card-body">
          <div class="price-row">
            <span class="label">Base Price:</span>
            <span class="value">${(profile.base_price || 0).toFixed(2)}</span>
          </div>
          <div class="price-row">
            <span class="label">Dog Surcharge:</span>
            <span class="value">${(profile.dog_surcharge || 0).toFixed(2)}</span>
          </div>
          {#if profile.description}
            <p class="description">{profile.description}</p>
          {/if}
        </div>
      </div>
    {/each}
    {#if costProfiles.length === 0}
      <div class="empty-state">No cost profiles found. Add your first profile!</div>
    {/if}
  </div>
</div>

<style>
  .profiles-page { padding: 2rem; }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
  h1 { color: #333; }
  .btn { padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem; }
  .btn-primary { background: #2563eb; color: white; }
  .btn-primary:hover { background: #1d4ed8; }
  .btn-secondary { background: #6b7280; color: white; }
  .btn-danger { background: #dc2626; color: white; }
  .btn-small { padding: 0.25rem 0.5rem; font-size: 0.8rem; }
  .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
  .modal { background: white; padding: 2rem; border-radius: 8px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; }
  .modal h2 { margin-top: 0; margin-bottom: 1.5rem; }
  .form-group { margin-bottom: 1rem; }
  .form-group label { display: block; margin-bottom: 0.25rem; font-weight: 500; color: #374151; }
  .form-group input, .form-group textarea { width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px; font-size: 1rem; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .form-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.5rem; }
  .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
  .card { background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; }
  .card-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
  .card-header h3 { margin: 0; font-size: 1.1rem; color: #374151; }
  .card-actions { display: flex; gap: 0.25rem; }
  .card-body { padding: 1rem; }
  .price-row { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #f3f4f6; }
  .price-row:last-child { border-bottom: none; }
  .label { color: #6b7280; }
  .value { font-weight: 600; color: #16a34a; }
  .description { margin-top: 1rem; color: #6b7280; font-size: 0.9rem; }
  .empty-state { text-align: center; color: #6b7280; padding: 3rem; background: white; border-radius: 8px; }
</style>

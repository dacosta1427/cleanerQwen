<script>
  import { onMount } from 'svelte';
  import { api } from '$lib/api';

  let owners = $state([]);
  let costProfiles = $state([]);
  let showForm = $state(false);
  let editingOwner = $state(null);
  
  let formData = $state({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  onMount(async () => {
    await loadOwners();
    await loadCostProfiles();
  });

  async function loadOwners() {
    try {
      owners = await api.getOwners();
    } catch (err) {
      console.error('Failed to load owners:', err);
    }
  }

  async function loadCostProfiles() {
    try {
      costProfiles = await api.getCostProfiles();
    } catch (err) {
      console.error('Failed to load cost profiles:', err);
    }
  }

  function openCreateForm() {
    editingOwner = null;
    formData = { name: '', email: '', phone: '', address: '' };
    showForm = true;
  }

  function openEditForm(owner) {
    editingOwner = owner;
    formData = { ...owner };
    showForm = true;
  }

  function closeForm() {
    showForm = false;
    editingOwner = null;
  }

  async function handleSubmit() {
    try {
      if (editingOwner) {
        await api.updateOwner(editingOwner.id, formData);
      } else {
        await api.createOwner(formData);
      }
      closeForm();
      await loadOwners();
    } catch (err) {
      console.error('Failed to save owner:', err);
      alert('Failed to save owner: ' + err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this owner?')) return;
    try {
      await api.deleteOwner(id);
      await loadOwners();
    } catch (err) {
      console.error('Failed to delete owner:', err);
      alert('Failed to delete owner: ' + err.message);
    }
  }
</script>

<div class="owners-page">
  <div class="header">
    <h1>Property Owners</h1>
    <button class="btn btn-primary" onclick={openCreateForm}>+ Add Owner</button>
  </div>

  {#if showForm}
    <div class="modal-overlay" onclick={closeForm}>
      <div class="modal" onclick={(e) => e.stopPropagation()}>
        <h2>{editingOwner ? 'Edit Owner' : 'Add New Owner'}</h2>
        <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <div class="form-group">
            <label>Name *</label>
            <input type="text" bind:value={formData.name} required />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" bind:value={formData.email} />
          </div>
          <div class="form-group">
            <label>Phone</label>
            <input type="tel" bind:value={formData.phone} />
          </div>
          <div class="form-group">
            <label>Address</label>
            <textarea bind:value={formData.address} rows="3"></textarea>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick={closeForm}>Cancel</button>
            <button type="submit" class="btn btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Phone</th>
          <th>Address</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each owners as owner (owner.id)}
          <tr>
            <td>{owner.name}</td>
            <td>{owner.email || '-'}</td>
            <td>{owner.phone || '-'}</td>
            <td>{owner.address || '-'}</td>
            <td class="actions">
              <button class="btn btn-small" onclick={() => openEditForm(owner)}>Edit</button>
              <button class="btn btn-small btn-danger" onclick={() => handleDelete(owner.id)}>Delete</button>
            </td>
          </tr>
        {/each}
        {#if owners.length === 0}
          <tr>
            <td colspan="5" class="empty-state">No owners found. Add your first owner!</td>
          </tr>
        {/if}
      </tbody>
    </table>
  </div>
</div>

<style>
  .owners-page {
    padding: 2rem;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  h1 {
    color: #333;
  }

  .btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
  }

  .btn-primary {
    background: #2563eb;
    color: white;
  }

  .btn-primary:hover {
    background: #1d4ed8;
  }

  .btn-secondary {
    background: #6b7280;
    color: white;
  }

  .btn-danger {
    background: #dc2626;
    color: white;
  }

  .btn-small {
    padding: 0.25rem 0.5rem;
    font-size: 0.8rem;
    margin-right: 0.5rem;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
  }

  .modal h2 {
    margin-top: 0;
    margin-bottom: 1.5rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.25rem;
    font-weight: 500;
    color: #374151;
  }

  .form-group input,
  .form-group textarea {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 1rem;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 1.5rem;
  }

  .table-container {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    overflow: hidden;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th, td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #e5e7eb;
  }

  th {
    background: #f9fafb;
    font-weight: 600;
    color: #374151;
  }

  tr:hover {
    background: #f9fafb;
  }

  .actions {
    white-space: nowrap;
  }

  .empty-state {
    text-align: center;
    color: #6b7280;
    padding: 2rem !important;
  }
</style>

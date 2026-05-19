<script>
  import { onMount } from 'svelte';
  import { api } from '$lib/api';

  let houses = $state([]);
  let owners = $state([]);
  let costProfiles = $state([]);
  let cleaners = $state([]);
  let showForm = $state(false);
  let editingHouse = $state(null);
  
  let formData = $state({
    name: '',
    address: '',
    owner_id: '',
    cost_profile_id: '',
    allows_dogs: false,
    number_of_rooms: '',
    square_footage: '',
    default_cleaner_id: '',
    notes: ''
  });

  onMount(async () => {
    await loadData();
  });

  async function loadData() {
    try {
      [houses, owners, costProfiles, cleaners] = await Promise.all([
        api.getHouses(),
        api.getOwners(),
        api.getCostProfiles(),
        api.getCleaners()
      ]);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  }

  function openCreateForm() {
    editingHouse = null;
    formData = {
      name: '',
      address: '',
      owner_id: owners[0]?.id || '',
      cost_profile_id: costProfiles[0]?.id || '',
      allows_dogs: false,
      number_of_rooms: '',
      square_footage: '',
      default_cleaner_id: '',
      notes: ''
    };
    showForm = true;
  }

  function openEditForm(house) {
    editingHouse = house;
    formData = { 
      ...house,
      allows_dogs: Boolean(house.allows_dogs)
    };
    showForm = true;
  }

  function closeForm() {
    showForm = false;
    editingHouse = null;
  }

  async function handleSubmit() {
    try {
      const data = {
        ...formData,
        owner_id: parseInt(formData.owner_id),
        cost_profile_id: parseInt(formData.cost_profile_id),
        default_cleaner_id: formData.default_cleaner_id ? parseInt(formData.default_cleaner_id) : null,
        number_of_rooms: formData.number_of_rooms ? parseInt(formData.number_of_rooms) : null,
        square_footage: formData.square_footage ? parseFloat(formData.square_footage) : null,
        allows_dogs: formData.allows_dogs ? 1 : 0
      };
      
      if (editingHouse) {
        await api.updateHouse(editingHouse.id, data);
      } else {
        await api.createHouse(data);
      }
      closeForm();
      await loadData();
    } catch (err) {
      console.error('Failed to save house:', err);
      alert('Failed to save house: ' + err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this house?')) return;
    try {
      await api.deleteHouse(id);
      await loadData();
    } catch (err) {
      console.error('Failed to delete house:', err);
      alert('Failed to delete house: ' + err.message);
    }
  }
</script>

<div class="houses-page">
  <div class="header">
    <h1>Houses</h1>
    <button class="btn btn-primary" onclick={openCreateForm}>+ Add House</button>
  </div>

  {#if showForm}
    <div class="modal-overlay" onclick={closeForm}>
      <div class="modal" onclick={(e) => e.stopPropagation()}>
        <h2>{editingHouse ? 'Edit House' : 'Add New House'}</h2>
        <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <div class="form-group">
            <label>Name *</label>
            <input type="text" bind:value={formData.name} required />
          </div>
          <div class="form-group">
            <label>Address *</label>
            <textarea bind:value={formData.address} rows="2" required></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Owner *</label>
              <select bind:value={formData.owner_id} required>
                {#each owners as owner}
                  <option value={owner.id}>{owner.name}</option>
                {/each}
              </select>
            </div>
            <div class="form-group">
              <label>Cost Profile *</label>
              <select bind:value={formData.cost_profile_id} required>
                {#each costProfiles as profile}
                  <option value={profile.id}>{profile.name} (${profile.base_price})</option>
                {/each}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Default Cleaner</label>
              <select bind:value={formData.default_cleaner_id}>
                <option value="">-- Select --</option>
                {#each cleaners as cleaner}
                  <option value={cleaner.id}>{cleaner.name}</option>
                {/each}
              </select>
            </div>
            <div class="form-group checkbox-group">
              <label>
                <input type="checkbox" bind:checked={formData.allows_dogs} />
                Allows Dogs (surcharge applies)
              </label>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Number of Rooms</label>
              <input type="number" bind:value={formData.number_of_rooms} />
            </div>
            <div class="form-group">
              <label>Square Footage</label>
              <input type="number" step="0.1" bind:value={formData.square_footage} />
            </div>
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

  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Address</th>
          <th>Owner</th>
          <th>Base Price</th>
          <th>Dogs</th>
          <th>Default Cleaner</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each houses as house (house.id)}
          <tr>
            <td>{house.name}</td>
            <td>{house.address}</td>
            <td>{house.owner_name || '-'}</td>
            <td>${house.base_price || 0}</td>
            <td>{house.allows_dogs ? '✓' : '✗'}</td>
            <td>{house.default_cleaner_name || '-'}</td>
            <td class="actions">
              <button class="btn btn-small" onclick={() => openEditForm(house)}>Edit</button>
              <button class="btn btn-small btn-danger" onclick={() => handleDelete(house.id)}>Delete</button>
            </td>
          </tr>
        {/each}
        {#if houses.length === 0}
          <tr>
            <td colspan="7" class="empty-state">No houses found. Add your first house!</td>
          </tr>
        {/if}
      </tbody>
    </table>
  </div>
</div>

<style>
  .houses-page { padding: 2rem; }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
  h1 { color: #333; }
  .btn { padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem; }
  .btn-primary { background: #2563eb; color: white; }
  .btn-primary:hover { background: #1d4ed8; }
  .btn-secondary { background: #6b7280; color: white; }
  .btn-danger { background: #dc2626; color: white; }
  .btn-small { padding: 0.25rem 0.5rem; font-size: 0.8rem; margin-right: 0.5rem; }
  .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
  .modal { background: white; padding: 2rem; border-radius: 8px; width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto; }
  .modal h2 { margin-top: 0; margin-bottom: 1.5rem; }
  .form-group { margin-bottom: 1rem; }
  .form-group label { display: block; margin-bottom: 0.25rem; font-weight: 500; color: #374151; }
  .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px; font-size: 1rem; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .checkbox-group label { display: flex; align-items: center; gap: 0.5rem; }
  .checkbox-group input { width: auto; }
  .form-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.5rem; }
  .table-container { background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 1rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
  th { background: #f9fafb; font-weight: 600; color: #374151; }
  tr:hover { background: #f9fafb; }
  .actions { white-space: nowrap; }
  .empty-state { text-align: center; color: #6b7280; padding: 2rem !important; }
</style>

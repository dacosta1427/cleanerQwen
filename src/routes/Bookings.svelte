<script>
  import { onMount } from 'svelte';
  import { api } from '$lib/api';

  let bookings = $state([]);
  let houses = $state([]);
  let showForm = $state(false);
  let editingBooking = $state(null);
  
  let formData = $state({
    house_id: '',
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    checkin_datetime: '',
    checkout_datetime: '',
    has_dogs: false,
    notes: ''
  });

  // Check-in/out time overrides (whole hours)
  let checkin_hour_override = $state(15);
  let checkout_hour_override = $state(10);

  onMount(async () => {
    await loadData();
  });

  async function loadData() {
    try {
      [bookings, houses] = await Promise.all([
        api.getBookings(),
        api.getHouses()
      ]);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  }

  function openCreateForm() {
    editingBooking = null;
    const now = new Date();
    const checkinDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    const checkoutDate = new Date(checkinDate.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days later
    
    checkinDate.setHours(checkin_hour_override, 0, 0, 0);
    checkoutDate.setHours(checkout_hour_override, 0, 0, 0);
    
    formData = {
      house_id: houses[0]?.id || '',
      guest_name: '',
      guest_email: '',
      guest_phone: '',
      checkin_datetime: checkinDate.toISOString().slice(0, 16),
      checkout_datetime: checkoutDate.toISOString().slice(0, 16),
      has_dogs: false,
      notes: ''
    };
    checkin_hour_override = 15;
    checkout_hour_override = 10;
    showForm = true;
  }

  function openEditForm(booking) {
    editingBooking = booking;
    formData = {
      ...booking,
      has_dogs: !!booking.has_dogs,
      checkin_datetime: booking.checkin_datetime?.slice(0, 16) || '',
      checkout_datetime: booking.checkout_datetime?.slice(0, 16) || ''
    };
    const checkinDate = new Date(formData.checkin_datetime);
    const checkoutDate = new Date(formData.checkout_datetime);
    checkin_hour_override = checkinDate.getHours();
    checkout_hour_override = checkoutDate.getHours();
    showForm = true;
  }

  function closeForm() {
    showForm = false;
    editingBooking = null;
  }

  function updateCheckinTime() {
    if (formData.checkin_datetime) {
      const date = new Date(formData.checkin_datetime);
      date.setHours(checkin_hour_override, 0, 0, 0);
      formData.checkin_datetime = date.toISOString().slice(0, 16);
    }
  }

  function updateCheckoutTime() {
    if (formData.checkout_datetime) {
      const date = new Date(formData.checkout_datetime);
      date.setHours(checkout_hour_override, 0, 0, 0);
      formData.checkout_datetime = date.toISOString().slice(0, 16);
    }
  }

  async function handleSubmit() {
    try {
      // Validate dates
      const checkinDate = new Date(formData.checkin_datetime);
      const checkoutDate = new Date(formData.checkout_datetime);
      
      if (checkoutDate <= checkinDate) {
        alert('Checkout time must be after check-in time');
        return;
      }

      const data = {
        ...formData,
        house_id: parseInt(formData.house_id),
        has_dogs: formData.has_dogs || false
      };
      
      if (editingBooking) {
        await api.updateBooking(editingBooking.id, data);
      } else {
        await api.createBooking(data);
      }
      closeForm();
      await loadData();
    } catch (err) {
      console.error('Failed to save booking:', err);
      alert('Failed to save booking: ' + err.message);
    }
  }

  async function deleteBooking(id) {
    if (!confirm('Are you sure you want to delete this booking?')) return;
    try {
      await api.deleteBooking(id);
      await loadData();
    } catch (err) {
      console.error('Failed to delete booking:', err);
      alert('Failed to delete booking: ' + err.message);
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  }

  function getHouseName(houseId) {
    const house = houses.find(h => h.id === houseId);
    return house ? house.name : 'Unknown';
  }
</script>

<div class="bookings-page">
  <div class="header">
    <h1>Bookings</h1>
    <button class="btn btn-primary" onclick={openCreateForm}>+ Add Booking</button>
  </div>

  {#if showForm}
    <div class="modal-overlay" onclick={closeForm}>
      <div class="modal modal-large" onclick={(e) => e.stopPropagation()}>
        <h2>{editingBooking ? 'Edit Booking' : 'Add New Booking'}</h2>
        <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <div class="form-group">
            <label>House *</label>
            <select bind:value={formData.house_id} required>
              {#each houses as house}
                <option value={house.id}>{house.name}</option>
              {/each}
            </select>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Guest Name</label>
              <input type="text" bind:value={formData.guest_name} />
            </div>
            <div class="form-group">
              <label>Guest Email</label>
              <input type="email" bind:value={formData.guest_email} />
            </div>
          </div>
          
          <div class="form-group">
            <label>Guest Phone</label>
            <input type="tel" bind:value={formData.guest_phone} />
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Check-in Date *</label>
              <input type="date" bind:value={formData.checkin_datetime} required onchange={() => {
                const parts = formData.checkin_datetime.split('T');
                if (parts.length === 2) {
                  const date = new Date(formData.checkin_datetime);
                  date.setHours(checkin_hour_override, 0, 0, 0);
                  formData.checkin_datetime = date.toISOString().slice(0, 16);
                }
              }} />
              <label style="margin-top: 0.5rem; font-size: 0.85rem;">Check-in Time (hour override)</label>
              <select bind:value={checkin_hour_override} onchange={updateCheckinTime} style="margin-top: 0.25rem;">
                {#each Array.from({length: 24}, (_, i) => i) as hour}
                  <option value={hour}>{String(hour).padStart(2, '0')}:00</option>
                {/each}
              </select>
            </div>
            <div class="form-group">
              <label>Checkout Date *</label>
              <input type="date" bind:value={formData.checkout_datetime} required onchange={() => {
                const parts = formData.checkout_datetime.split('T');
                if (parts.length === 2) {
                  const date = new Date(formData.checkout_datetime);
                  date.setHours(checkout_hour_override, 0, 0, 0);
                  formData.checkout_datetime = date.toISOString().slice(0, 16);
                }
              }} />
              <label style="margin-top: 0.5rem; font-size: 0.85rem;">Checkout Time (hour override)</label>
              <select bind:value={checkout_hour_override} onchange={updateCheckoutTime} style="margin-top: 0.25rem;">
                {#each Array.from({length: 24}, (_, i) => i) as hour}
                  <option value={hour}>{String(hour).padStart(2, '0')}:00</option>
                {/each}
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>
                <input type="checkbox" bind:checked={formData.has_dogs} />
                Guest has dogs
              </label>
            </div>
            <div class="form-group">
              <label>House allows dogs: {houses.find(h => h.id == formData.house_id)?.allows_dogs ? 'Yes' : 'No'}</label>
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
          <th>House</th>
          <th>Guest</th>
          <th>Check-in</th>
          <th>Checkout</th>
          <th>Dogs</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each bookings as booking (booking.id)}
          <tr>
            <td>{booking.house_name}</td>
            <td>{booking.guest_name || '-'}</td>
            <td>{formatDate(booking.checkin_datetime)}</td>
            <td>{formatDate(booking.checkout_datetime)}</td>
            <td>
              {#if booking.has_dogs}
                <span class="status-badge status-dogs">🐕 Yes</span>
              {:else}
                <span class="status-badge status-no-dogs">No</span>
              {/if}
            </td>
            <td class="actions">
              <button class="btn btn-small" onclick={() => openEditForm(booking)}>Edit</button>
              <button class="btn btn-small btn-danger" onclick={() => deleteBooking(booking.id)}>Delete</button>
            </td>
          </tr>
        {/each}
        {#if bookings.length === 0}
          <tr>
            <td colspan="6" class="empty-state">No bookings found.</td>
          </tr>
        {/if}
      </tbody>
    </table>
  </div>
</div>

<style>
  .bookings-page { padding: 2rem; }
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
  .modal-large { max-width: 700px; }
  .modal h2 { margin-top: 0; margin-bottom: 1.5rem; }
  .form-group { margin-bottom: 1rem; }
  .form-group label { display: block; margin-bottom: 0.25rem; font-weight: 500; color: #374151; }
  .form-group input[type="text"], .form-group input[type="email"], .form-group input[type="tel"], 
  .form-group input[type="date"], .form-group select, .form-group textarea { width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px; font-size: 1rem; }
  .form-group input[type="checkbox"] { width: auto; margin-right: 0.5rem; }
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
  .status-dogs { background: #fef3c7; color: #92400e; }
  .status-no-dogs { background: #e5e7eb; color: #374151; }
</style>

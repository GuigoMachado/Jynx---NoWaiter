const tablesGrid = document.getElementById('tablesGrid');
const totalOrdersCount = document.getElementById('totalOrdersCount');
const grandTotalValue = document.getElementById('grandTotalValue');
const refreshTables = document.getElementById('refreshTables');
const openKitchenBtn = document.getElementById('openKitchenBtn');
const clearAttendedCallsBtn = document.getElementById('clearAttendedCallsBtn');
const garconCallsList = document.getElementById('garconCallsList');

const tableCount = 10;
const formatPrice = (value) => `R$ ${value.toFixed(2).replace('.', ',')}`;

const loadOrders = async () => {
  try {
    const response = await fetch('/api/orders');
    if (!response.ok) {
      throw new Error(`Falha ao carregar pedidos: ${response.status}`);
    }

    const rows = await response.json();
    let total = 0;
    rows.forEach((row) => {
      total += Number(row.total_price || 0);
    });
    totalOrdersCount.textContent = `${rows.length} pedido${rows.length === 1 ? '' : 's'}`;
    grandTotalValue.textContent = `Total: ${formatPrice(total)}`;
  } catch (error) {
    console.error(error);
    totalOrdersCount.textContent = 'Falha ao carregar pedidos';
    grandTotalValue.textContent = 'Total: R$ 0,00';
  }
};

const renderTableButtons = () => {
  tablesGrid.innerHTML = '';
  for (let i = 1; i <= tableCount; i += 1) {
    const btn = document.createElement('button');
    btn.className = 'table-btn';
    btn.textContent = `Mesa ${i}`;
    btn.addEventListener('click', () => openTableOrders(i));
    tablesGrid.appendChild(btn);
  }
};

const tableOrdersModal = document.getElementById('tableOrdersModal');
const tableOrdersBody = document.getElementById('tableOrdersBody');
const tableOrdersTitle = document.getElementById('tableOrdersTitle');
const tableOrdersTotal = document.getElementById('tableOrdersTotal');
const clearTableBtn = document.getElementById('clearTableBtn');
const kitchenModal = document.getElementById('kitchenModal');
const kitchenOrdersBody = document.getElementById('kitchenOrdersBody');
let activeTableNumber = null;

const openTableOrders = async (tableNumber) => {
  activeTableNumber = tableNumber;
  try {
    const res = await fetch(`/api/orders?table_number=${tableNumber}`);
    if (!res.ok) throw new Error('Falha ao carregar pedidos da mesa');
    const rows = await res.json();

    tableOrdersTitle.textContent = `Pedidos da Mesa ${tableNumber}`;
    tableOrdersBody.innerHTML = '';

    let sum = 0;
    rows.forEach((r) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.item_name || r.item_id}</td>
        <td>${r.quantity}</td>
        <td>${formatPrice(Number(r.price_each || 0))}</td>
        <td>${formatPrice(Number(r.total_price || 0))}</td>
      `;
      tableOrdersBody.appendChild(tr);
      sum += Number(r.total_price || 0);
    });

    tableOrdersTotal.textContent = `Total: ${formatPrice(sum)}`;
    tableOrdersModal.classList.add('modal-open');
    tableOrdersModal.setAttribute('aria-hidden', 'false');
  } catch (err) {
    console.error(err);
    alert('Erro ao carregar pedidos da mesa');
  }
};

const clearTableOrders = async () => {
  if (!activeTableNumber) return;
  const confirmed = confirm(`Deseja realmente limpar todos os pedidos da Mesa ${activeTableNumber}?`);
  if (!confirmed) return;

  clearTableBtn.disabled = true;
  clearTableBtn.textContent = 'Limpando...';

  try {
    const res = await fetch(`/api/orders?table_number=${activeTableNumber}`, {
      method: 'DELETE'
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Falha ao limpar pedidos da mesa: ${res.status} ${errorText}`);
    }

    await loadOrders();
    await loadWaiterCalls();
    tableOrdersBody.innerHTML = '';
    tableOrdersTotal.textContent = 'Total: R$ 0,00';
    tableOrdersModal.classList.remove('modal-open');
    tableOrdersModal.setAttribute('aria-hidden', 'true');
    alert(`Mesa ${activeTableNumber} limpa com sucesso.`);
    activeTableNumber = null;
  } catch (err) {
    console.error(err);
    alert('Erro ao limpar pedidos da mesa');
  } finally {
    clearTableBtn.disabled = false;
    clearTableBtn.textContent = 'Limpar Mesa';
  }
};

const openKitchenScreen = async () => {
  try {
    const res = await fetch('/api/kitchen-orders');
    if (!res.ok) throw new Error('Falha ao carregar pedidos da cozinha');
    const rows = await res.json();

    kitchenOrdersBody.innerHTML = '';
    rows.forEach((row) => {
      const tr = document.createElement('tr');
      const statusLabel = row.order_status === 'done' ? 'Pronto' : 'Pendente';
      const isDone = row.order_status === 'done';

      tr.innerHTML = `
        <td>${row.table_number}</td>
        <td>${row.item_name || row.item_id}</td>
        <td>${row.quantity}</td>
        <td>${row.notes || '-'}</td>
        <td>${statusLabel}</td>
        <td>${new Date(row.created_at).toLocaleTimeString('pt-BR')}</td>
        <td><button data-order-id="${row.id}" class="kitchen-action-btn" ${isDone ? 'disabled' : ''}>Pronto</button></td>
      `;
      kitchenOrdersBody.appendChild(tr);
    });

    kitchenModal.classList.add('modal-open');
    kitchenModal.setAttribute('aria-hidden', 'false');
  } catch (err) {
    console.error(err);
    alert('Erro ao abrir a tela da cozinha');
  }
};

const markOrderDone = async (orderId) => {
  try {
    const res = await fetch(`/api/orders/${orderId}/done`, {
      method: 'PATCH',
    });
    if (!res.ok) throw new Error('Falha ao marcar pedido como pronto');
    await loadOrders();
    await loadWaiterCalls();
    await openKitchenScreen();
  } catch (err) {
    console.error(err);
    alert('Erro ao marcar pedido como pronto');
  }
};

// Close modal binding
const tableModalClose = tableOrdersModal.querySelector('.modal-close');
tableModalClose.addEventListener('click', () => {
  tableOrdersModal.classList.remove('modal-open');
  tableOrdersModal.setAttribute('aria-hidden', 'true');
});
clearTableBtn.addEventListener('click', clearTableOrders);

const kitchenModalClose = kitchenModal.querySelector('.modal-close');
kitchenModalClose.addEventListener('click', () => {
  kitchenModal.classList.remove('modal-open');
  kitchenModal.setAttribute('aria-hidden', 'true');
});

openKitchenBtn.addEventListener('click', openKitchenScreen);

kitchenOrdersBody.addEventListener('click', (event) => {
  const button = event.target.closest('.kitchen-action-btn');
  if (!button) return;
  const orderId = button.dataset.orderId;
  if (orderId) {
    markOrderDone(orderId);
  }
});

// Waiter calls
const toggleCallStatus = async (id, newStatus) => {
  try {
    const res = await fetch(`/api/call-waiter/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    if (!res.ok) throw new Error('Falha ao atualizar status da chamada');
    loadWaiterCalls();
  } catch (err) {
    console.error(err);
  }
};

const loadWaiterCalls = async () => {
  try {
    const res = await fetch('/api/call-waiter');
    if (!res.ok) throw new Error('Falha ao carregar chamadas');
    const rows = await res.json();
    garconCallsList.innerHTML = '';
    rows.forEach((r) => {
      const status = r.status === 'attended' ? 'attended' : 'waiting';
      const entry = document.createElement('div');
      entry.className = `garcon-call ${status}`;

      const time = r.created_at ? new Date(r.created_at).toLocaleTimeString('pt-BR') : '-';
      const typeLabel = r.call_type === 'kitchen' ? ' - Cozinha' : '';
      const info = document.createElement('div');
      info.className = 'call-info';
      info.innerHTML = `<strong>Mesa ${r.table_number}${typeLabel}</strong><span class="call-time">${time}</span>`;

      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = status === 'waiting' ? 'Aguardando' : 'Atendido';
      button.addEventListener('click', () => toggleCallStatus(r.id, status === 'waiting' ? 'attended' : 'waiting'));

      entry.appendChild(info);
      entry.appendChild(button);
      garconCallsList.appendChild(entry);
    });
  } catch (err) {
    console.error(err);
  }
};

refreshTables.addEventListener('click', () => { loadOrders(); loadWaiterCalls(); });
clearAttendedCallsBtn.addEventListener('click', async () => {
  const confirmed = confirm('Deseja remover todas as chamadas já atendidas?');
  if (!confirmed) return;
  try {
    const res = await fetch('/api/call-waiter/attended', { method: 'DELETE' });
    if (!res.ok) throw new Error('Falha ao limpar chamadas atendidas');
    loadWaiterCalls();
  } catch (err) {
    console.error(err);
  }
});

renderTableButtons();
loadOrders();
loadWaiterCalls();

// Poll waiter calls every 5s so staff see new requests
setInterval(loadWaiterCalls, 5000);

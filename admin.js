const tablesGrid = document.getElementById('tablesGrid');
const totalOrdersCount = document.getElementById('totalOrdersCount');
const grandTotalValue = document.getElementById('grandTotalValue');
const generalSummaryList = document.getElementById('generalSummaryList');
const refreshTables = document.getElementById('refreshTables');
const openKitchenBtn = document.getElementById('openKitchenBtn');
const garconCallsList = document.getElementById('garconCallsList');

const tableCount = 10;
const formatPrice = (value) => `R$ ${value.toFixed(2).replace('.', ',')}`;
const formatDateLabel = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data indisponível';
  return date.toLocaleDateString('pt-BR');
};

const formatTimeLabel = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--:--';
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const loadOrderSummary = async () => {
  try {
    const response = await fetch('/api/order-history');
    if (!response.ok) {
      throw new Error(`Falha ao carregar histórico de pedidos: ${response.status}`);
    }

    const rows = await response.json();
    const groupedByDate = rows.reduce((groups, row) => {
      const dateKey = formatDateLabel(row.created_at);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(row);
      return groups;
    }, {});

    const sortedDates = Object.keys(groupedByDate).sort((left, right) => {
      const leftDate = new Date(groupedByDate[left][0]?.created_at || 0);
      const rightDate = new Date(groupedByDate[right][0]?.created_at || 0);
      return leftDate - rightDate;
    });

    let total = 0;
    const fragment = document.createDocumentFragment();

    sortedDates.forEach((dateKey) => {
      const orders = groupedByDate[dateKey].sort((a, b) => new Date(a.created_at) - new Date(b.created_at) || Number(a.id) - Number(b.id));
      const dateBlock = document.createElement('section');
      dateBlock.className = 'summary-date-group';

      const header = document.createElement('div');
      header.className = 'summary-date-header';
      header.innerHTML = `
        <strong>${dateKey}</strong>
        <span>${orders.length} pedido${orders.length === 1 ? '' : 's'}</span>
      `;

      const list = document.createElement('div');
      list.className = 'summary-order-list';

      orders.forEach((row) => {
        const item = document.createElement('article');
        item.className = 'summary-order-item';
        const notes = row.notes && row.notes !== '-' ? row.notes : 'Sem observações';
        item.innerHTML = `
          <div class="summary-order-main">
            <strong>${formatTimeLabel(row.created_at)} - Mesa ${row.table_number}</strong>
            <span>${row.item_name || row.item_id} x${row.quantity}</span>
          </div>
          <div class="summary-order-meta">
            <span>${notes}</span>
            <strong>${formatPrice(Number(row.total_price || 0))}</strong>
          </div>
        `;
        list.appendChild(item);
        total += Number(row.total_price || 0);
      });

      dateBlock.appendChild(header);
      dateBlock.appendChild(list);
      fragment.appendChild(dateBlock);
    });

    totalOrdersCount.textContent = `${rows.length} pedido${rows.length === 1 ? '' : 's'}`;
    grandTotalValue.textContent = `Total: ${formatPrice(total)}`;
    generalSummaryList.innerHTML = '';
    generalSummaryList.appendChild(fragment);
  } catch (error) {
    console.error(error);
    totalOrdersCount.textContent = 'Falha ao carregar pedidos';
    grandTotalValue.textContent = 'Total: R$ 0,00';
    if (generalSummaryList) {
      generalSummaryList.innerHTML = '';
    }
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
const finalizeTableBtn = document.getElementById('finalizeTableBtn');
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
        <td><button class="item-cancel-btn" data-order-id="${r.id}" title="Cancelar item" style="background: #f44336; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-weight: bold;">×</button></td>
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
  const confirmed = confirm(`Deseja realmente limpar todos os pedidos da Mesa ${activeTableNumber}? (Sem adicionar ao resumo)`);
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

    await loadOrderSummary();
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
    clearTableBtn.textContent = 'Limpar Comanda';
  }
};

const finalizeTableOrders = async () => {
  if (!activeTableNumber) return;
  const confirmed = confirm(`Deseja realmente fechar a comanda da Mesa ${activeTableNumber}? (Adicionará ao resumo)`);
  if (!confirmed) return;

  finalizeTableBtn.disabled = true;
  finalizeTableBtn.textContent = 'Fechando...';

  try {
    const res = await fetch(`/api/orders/finalize/${activeTableNumber}`, {
      method: 'POST'
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Falha ao fechar comanda da mesa: ${res.status} ${errorText}`);
    }

    await loadOrderSummary();
    await loadWaiterCalls();
    
    // Clear the orders from the table
    const deleteRes = await fetch(`/api/orders?table_number=${activeTableNumber}`, {
      method: 'DELETE'
    });
    
    tableOrdersBody.innerHTML = '';
    tableOrdersTotal.textContent = 'Total: R$ 0,00';
    tableOrdersModal.classList.remove('modal-open');
    tableOrdersModal.setAttribute('aria-hidden', 'true');
    alert(`Mesa ${activeTableNumber} fechada com sucesso e adicionada ao resumo.`);
    activeTableNumber = null;
  } catch (err) {
    console.error(err);
    alert('Erro ao fechar a comanda da mesa');
  } finally {
    finalizeTableBtn.disabled = false;
    finalizeTableBtn.textContent = 'Fechar Comanda';
  }
};

const deleteOrderItem = async (orderId) => {
  const confirmed = confirm('Deseja realmente cancelar este item?');
  if (!confirmed) return;

  try {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'DELETE'
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Falha ao cancelar item');
    }

    const data = await res.json();
    console.log('Item deleted successfully:', data);

    // Reload the table orders
    if (activeTableNumber) {
      await openTableOrders(activeTableNumber);
    }
  } catch (err) {
    console.error('Error deleting item:', err);
    alert('Erro ao cancelar o item: ' + err.message);
    // Still try to reload on error
    if (activeTableNumber) {
      await openTableOrders(activeTableNumber);
    }
  }
};

const openKitchenScreen = async () => {
  try {
    const res = await fetch('/api/kitchen-orders');
    if (!res.ok) throw new Error('Falha ao carregar pedidos da cozinha');
    const rows = (await res.json()).slice().sort((a, b) => {
      const left = new Date(a.created_at).getTime();
      const right = new Date(b.created_at).getTime();
      if (left !== right) return left - right;
      return Number(a.id) - Number(b.id);
    });

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
        <td>${formatTimeLabel(row.created_at)}</td>
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
    await loadOrderSummary();
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
finalizeTableBtn.addEventListener('click', finalizeTableOrders);

// Event delegation for item cancel buttons
tableOrdersBody.addEventListener('click', (event) => {
  const button = event.target;
  if (!button.classList.contains('item-cancel-btn')) return;
  const orderId = button.dataset.orderId;
  if (orderId) {
    deleteOrderItem(orderId);
  }
});

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
const attendedCallRemovalTimers = new Map();

const removeWaiterCall = async (id) => {
  try {
    const res = await fetch(`/api/call-waiter/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      throw new Error('Falha ao remover chamada atendida');
    }
    attendedCallRemovalTimers.delete(id);
    loadWaiterCalls();
  } catch (err) {
    console.error(err);
  }
};

const scheduleAttendedCallRemoval = (id) => {
  if (attendedCallRemovalTimers.has(id)) {
    return;
  }

  const timerId = window.setTimeout(() => {
    attendedCallRemovalTimers.delete(id);
    removeWaiterCall(id);
  }, 4000);

  attendedCallRemovalTimers.set(id, timerId);
};

const toggleCallStatus = async (id, newStatus) => {
  try {
    const res = await fetch(`/api/call-waiter/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    if (!res.ok) throw new Error('Falha ao atualizar status da chamada');
    if (newStatus === 'attended') {
      scheduleAttendedCallRemoval(id);
    }
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
      button.textContent = status === 'waiting' ? 'Atender' : 'Atendido';
      button.disabled = status === 'attended';
      if (status === 'waiting') {
        button.addEventListener('click', () => toggleCallStatus(r.id, 'attended'));
      }

      if (status === 'attended') {
        scheduleAttendedCallRemoval(r.id);
      }

      entry.appendChild(info);
      entry.appendChild(button);
      garconCallsList.appendChild(entry);
    });
  } catch (err) {
    console.error(err);
  }
};

refreshTables.addEventListener('click', () => { loadOrderSummary(); loadWaiterCalls(); });

renderTableButtons();
loadOrderSummary();
loadWaiterCalls();

// Poll waiter calls every 5s so staff see new requests
setInterval(loadWaiterCalls, 5000);

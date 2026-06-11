const tablesGrid = document.getElementById('tablesGrid');
const totalOrdersCount = document.getElementById('totalOrdersCount');
const grandTotalValue = document.getElementById('grandTotalValue');
const generalSummaryList = document.getElementById('generalSummaryList');
const summarySearchInput = document.getElementById('summarySearchInput');
const openKitchenBtn = document.getElementById('openKitchenBtn');
const garconCallsList = document.getElementById('garconCallsList');

const tableCount = 10;
const SUMMARY_OPEN_DAYS_KEY = 'jynx-summary-open-days';
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

const getDateKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'invalid-date';
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTimestamp = (value) => {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const normalizeText = (value) => String(value || '').toLowerCase().trim();

const readOpenDayKeys = () => {
  try {
    const rawValue = window.localStorage.getItem(SUMMARY_OPEN_DAYS_KEY);
    const parsed = rawValue ? JSON.parse(rawValue) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch (error) {
    return new Set();
  }
};

const saveOpenDayKeys = (openDayKeys) => {
  try {
    window.localStorage.setItem(SUMMARY_OPEN_DAYS_KEY, JSON.stringify(Array.from(openDayKeys)));
  } catch (error) {
    // Ignore storage failures and keep rendering normally.
  }
};

const loadOrderSummary = async () => {
  try {
    const response = await fetch('/api/order-history', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Falha ao carregar histórico de pedidos: ${response.status}`);
    }

    const rows = await response.json();
    const groupedBySession = rows.reduce((groups, row) => {
      const tableKey = `Mesa ${row.table_number || '-'}`;
      const closedAt = row.closed_at || row.created_at || row.id;
      const groupKey = `${tableKey}__${closedAt}`;
      if (!groups[groupKey]) {
        groups[groupKey] = {
          tableKey,
          closedAt,
          firstOrderAt: row.created_at || closedAt,
          rows: [],
        };
      }
      groups[groupKey].rows.push(row);
      if (row.created_at && getTimestamp(row.created_at) < getTimestamp(groups[groupKey].firstOrderAt)) {
        groups[groupKey].firstOrderAt = row.created_at;
      }
      return groups;
    }, {});

    const sortedSessions = Object.values(groupedBySession)
      .map((group) => ({
        tableKey: group.tableKey,
        closedAt: group.closedAt,
        firstOrderAt: group.firstOrderAt,
        tableRows: group.rows,
        historyIds: group.rows.map((row) => row.id),
        sessionTotal: group.rows.reduce((sum, row) => sum + Number(row.total_price || 0), 0),
        latestAt: getTimestamp(group.closedAt),
        dayKey: getDateKey(group.firstOrderAt || group.closedAt),
        dayStamp: group.firstOrderAt || group.closedAt,
      }))
      .sort((left, right) => right.latestAt - left.latestAt || getTimestamp(right.firstOrderAt) - getTimestamp(left.firstOrderAt) || Number(right.tableKey.replace('Mesa ', '')) - Number(left.tableKey.replace('Mesa ', '')));

    const groupedByDay = sortedSessions.reduce((groups, session) => {
      if (!groups[session.dayKey]) {
        groups[session.dayKey] = {
          dayKey: session.dayKey,
          dayStamp: session.dayStamp,
          latestAt: session.latestAt,
          sessions: [],
        };
      }

      groups[session.dayKey].sessions.push(session);
      if (session.latestAt > groups[session.dayKey].latestAt) {
        groups[session.dayKey].latestAt = session.latestAt;
        groups[session.dayKey].dayStamp = session.dayStamp;
      }

      return groups;
    }, {});

    const sortedDays = Object.values(groupedByDay)
      .map((day) => ({
        ...day,
        dayLabel: formatDateLabel(day.dayStamp || day.latestAt),
        dayTotal: day.sessions.reduce((sum, session) => sum + session.sessionTotal, 0),
        sessions: day.sessions.slice().sort((left, right) => right.latestAt - left.latestAt || getTimestamp(right.firstOrderAt) - getTimestamp(left.firstOrderAt) || Number(right.tableKey.replace('Mesa ', '')) - Number(left.tableKey.replace('Mesa ', ''))),
      }))
      .sort((left, right) => right.latestAt - left.latestAt || right.dayKey.localeCompare(left.dayKey));

    const searchQuery = normalizeText(summarySearchInput?.value);
    const savedOpenDayKeys = readOpenDayKeys();
    const filteredDays = searchQuery
      ? sortedDays
          .map((day) => {
            const matchingSessions = day.sessions.filter((session) => {
              const sessionText = normalizeText([
                day.dayLabel,
                day.dayKey,
                session.tableKey,
                formatPrice(session.sessionTotal),
                session.firstOrderAt,
                session.closedAt,
                ...session.tableRows.flatMap((row) => [row.item_name, row.item_id, row.notes, row.created_at, row.total_price]),
              ].join(' '));

              return sessionText.includes(searchQuery);
            });

            return matchingSessions.length
              ? {
                  ...day,
                  sessions: matchingSessions,
                }
              : null;
          })
          .filter(Boolean)
      : sortedDays;

    let total = 0;
    const fragment = document.createDocumentFragment();

    filteredDays.forEach((day) => {
      const dayBlock = document.createElement('section');
      dayBlock.className = 'summary-day-group';

      const shouldOpen = searchQuery ? true : savedOpenDayKeys.has(day.dayKey);
      if (shouldOpen) {
        dayBlock.classList.add('is-open');
      }

      const header = document.createElement('button');
      header.type = 'button';
      header.className = 'summary-day-header';
      header.setAttribute('aria-expanded', String(shouldOpen));

      const content = document.createElement('div');
      content.className = 'summary-day-content';
      content.hidden = !shouldOpen;

      header.innerHTML = `
        <div class="summary-day-title">
          <strong>${day.dayLabel}</strong>
          <span>${day.sessions.length} comanda${day.sessions.length === 1 ? '' : 's'}</span>
        </div>
        <div class="summary-day-meta">
          <span>${shouldOpen ? 'Toque para fechar' : 'Toque para abrir'}</span>
          <strong>${formatPrice(day.dayTotal)}</strong>
        </div>
        <span class="summary-day-chevron" aria-hidden="true">${shouldOpen ? '▾' : '▸'}</span>
      `;

      header.addEventListener('click', () => {
        const isOpen = !content.hidden;
        content.hidden = isOpen;
        const nextIsOpen = !isOpen;
        header.setAttribute('aria-expanded', String(nextIsOpen));
        dayBlock.classList.toggle('is-open', nextIsOpen);
        const metaLabel = header.querySelector('.summary-day-meta span');
        if (metaLabel) {
          metaLabel.textContent = nextIsOpen ? 'Toque para fechar' : 'Toque para abrir';
        }
        const chevron = header.querySelector('.summary-day-chevron');
        if (chevron) {
          chevron.textContent = nextIsOpen ? '▾' : '▸';
        }

        const openDayKeys = readOpenDayKeys();
        if (nextIsOpen) {
          openDayKeys.add(day.dayKey);
        } else {
          openDayKeys.delete(day.dayKey);
        }
        saveOpenDayKeys(openDayKeys);
      });

      day.sessions.forEach(({ tableKey, tableRows, sessionTotal, historyIds }) => {
        const orders = tableRows.slice().sort((a, b) => new Date(a.created_at) - new Date(b.created_at) || Number(a.id) - Number(b.id));
        const tableBlock = document.createElement('section');
        tableBlock.className = 'summary-table-group';

        const sessionHeader = document.createElement('div');
        sessionHeader.className = 'summary-table-header';
        const firstOrderStamp = orders[0]?.created_at || tableRows[0]?.created_at;
        const closeStamp = orders[orders.length - 1]?.closed_at || tableRows[0]?.closed_at || firstOrderStamp;
        const firstOrderTime = firstOrderStamp ? formatTimeLabel(firstOrderStamp) : '--:--';
        const closeTime = closeStamp ? formatTimeLabel(closeStamp) : '--:--';
        const tableDay = firstOrderStamp ? formatDateLabel(firstOrderStamp) : 'Data indisponível';
        sessionHeader.innerHTML = `
          <div class="summary-table-title">
            <strong>${tableKey}</strong>
            <span>${orders.length} item${orders.length === 1 ? '' : 's'}</span>
          </div>
          <div class="summary-table-meta">
            <span>Total da comanda</span>
            <strong>${formatPrice(sessionTotal)}</strong>
            <span>${tableDay}</span>
            <strong>${firstOrderTime} - ${closeTime}</strong>
          </div>
        `;

        const list = document.createElement('div');
        list.className = 'summary-table-items';

        orders.forEach((row) => {
          const item = document.createElement('div');
          item.className = 'summary-table-item';
          const notes = row.notes && row.notes !== '-' ? row.notes : 'Sem observações';
          const orderTime = row.created_at ? formatTimeLabel(row.created_at) : '--:--';
          item.innerHTML = `
            <div class="summary-table-item-main">
              <div class="summary-table-item-top">
                <strong>${row.item_name || row.item_id} x${row.quantity}</strong>
                <span class="summary-table-item-time">${orderTime}</span>
              </div>
              <span>${notes}</span>
            </div>
            <strong class="summary-table-item-price">${formatPrice(Number(row.total_price || 0))}</strong>
          `;
          list.appendChild(item);
          total += Number(row.total_price || 0);
        });

        const footer = document.createElement('div');
        footer.className = 'summary-table-footer';
        footer.innerHTML = `
          <button type="button" class="summary-table-delete-btn" data-history-ids="${historyIds.join(',')}">Excluir</button>
        `;

        footer.querySelector('.summary-table-delete-btn').addEventListener('click', async (event) => {
          event.stopPropagation();
          const deleteButton = event.currentTarget;
          const confirmed = confirm(`Deseja excluir esta comanda da ${tableKey}?`);
          if (!confirmed) {
            return;
          }

          const historyIds = deleteButton.dataset.historyIds;
          deleteButton.disabled = true;
          deleteButton.textContent = 'Excluindo...';

          try {
            const response = await fetch('/api/order-history/session-delete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ historyIds }),
            });

            const responseData = await response.json().catch(() => null);
            if (!response.ok || !responseData?.deleted) {
              const errorMessage = responseData?.error || responseData?.detail || `HTTP ${response.status}`;
              throw new Error(`Falha ao excluir resumo: ${errorMessage}`);
            }

            tableBlock.remove();
            if (!dayBlock.querySelector('.summary-table-group')) {
              dayBlock.remove();
            }

            await loadOrderSummary();
          } catch (error) {
            console.error(error);
            alert('Erro ao excluir a comanda do resumo');
          } finally {
            deleteButton.disabled = false;
            deleteButton.textContent = 'Excluir';
          }
        });

        tableBlock.appendChild(sessionHeader);
        tableBlock.appendChild(list);
        tableBlock.appendChild(footer);
        content.appendChild(tableBlock);
      });

      dayBlock.appendChild(header);
      dayBlock.appendChild(content);
      fragment.appendChild(dayBlock);
    });

    totalOrdersCount.textContent = `${rows.length} pedido${rows.length === 1 ? '' : 's'}`;
    grandTotalValue.textContent = `Total: ${formatPrice(total)}`;
    generalSummaryList.innerHTML = '';
    generalSummaryList.appendChild(fragment);

    if (summarySearchInput && searchQuery && filteredDays.length === 0) {
      totalOrdersCount.textContent = 'Nenhum resultado encontrado';
      grandTotalValue.textContent = `Total: ${formatPrice(0)}`;
    }
  } catch (error) {
    console.error(error);
    totalOrdersCount.textContent = 'Falha ao carregar pedidos';
    grandTotalValue.textContent = 'Total: R$ 0,00';
    if (generalSummaryList) {
      generalSummaryList.innerHTML = '';
    }
  }
};

if (summarySearchInput) {
  summarySearchInput.addEventListener('input', () => {
    loadOrderSummary();
  });
}

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
    await fetch(`/api/orders?table_number=${activeTableNumber}`, {
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

    await res.json();

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
  }, 500);

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

renderTableButtons();
loadOrderSummary();
loadWaiterCalls();

// Poll waiter calls every 5s so staff see new requests
setInterval(loadWaiterCalls, 5000);

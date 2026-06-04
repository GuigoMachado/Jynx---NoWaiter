const menuButton = document.querySelector('.botaoMenuCardapio');
const menuContainer = document.querySelector('.esconderCardapio');
const categoryButtons = document.querySelectorAll('.categoriaPratos');
const comandaButton = document.querySelector('.botaoMenuComanda');
const modal = document.getElementById('itemModal');
const cartModal = document.getElementById('cartModal');
const closeModalButton = modal.querySelector('.modal-close');
const cartCloseButton = cartModal.querySelector('.modal-close');
const modalTitle = modal.querySelector('.modal-title');
const cardsList = modal.querySelector('.item-list');
const cartList = cartModal.querySelector('.cart-list');
const modalSummary = modal.querySelector('.modal-order-summary');
const modalOrderTotal = modal.querySelector('.modal-order-total');
const totalValueSpan = document.querySelector('.valor');
const mesaSpan = document.querySelector('.mesa');

let currentTableNumber = 1;

const getTableNumberFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  const tableParam = params.get('table') || params.get('table_number');
  const parsedNumber = parseInt(tableParam, 10);
  return Number.isInteger(parsedNumber) && parsedNumber > 0 ? parsedNumber : 1;
};

const updateUrlWithTableNumber = (tableNumber) => {
  const params = new URLSearchParams(window.location.search);
  params.set('table', tableNumber);
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, '', newUrl);
};

const setTableNumber = (tableNumber) => {
  currentTableNumber = tableNumber;
  mesaSpan.textContent = `Mesa ${tableNumber}`;
  updateUrlWithTableNumber(tableNumber);
};

const getTableNumber = () => currentTableNumber;

const orderHistory = [];

// Current modal items (temporary cart for current modal)
const currentModalItems = {};

const formatPrice = (value) => `R$ ${value.toFixed(2).replace('.', ',')}`;
const fallbackImageUrl = '/img/placeholder.svg';

const getItemImageUrl = (item) => {
  return item.image_url || fallbackImageUrl;
};

const fetchCategoryItems = async (category) => {
  try {
    const response = await fetch(`/api/category-items?category=${encodeURIComponent(category)}`);
    if (!response.ok) {
      throw new Error(`API error ${response.status}`);
    }

    const items = await response.json();
    if (!Array.isArray(items)) {
      throw new Error('Invalid API response');
    }

    return items;
  } catch (error) {
    console.error('Failed to load category items from API:', error);
    return null;
  }
};

const renderEmptyState = (message, container) => {
  const emptyMessage = document.createElement('div');
  emptyMessage.className = 'empty-state';
  emptyMessage.textContent = message;
  container.append(emptyMessage);
};

const loadTableOrders = async () => {
  try {
    const response = await fetch(`/api/orders?table_number=${currentTableNumber}`);
    if (!response.ok) {
      throw new Error(`Failed to load orders: ${response.status}`);
    }

    const rows = await response.json();
    if (!Array.isArray(rows)) {
      throw new Error('Invalid orders response from server');
    }

    orderHistory.length = 0;
    rows.forEach((row) => {
      orderHistory.push({
        id: row.id,
        name: row.item_name || row.item_id,
        price: Number(row.price_each),
        quantity: Number(row.quantity),
        total: Number(row.total_price),
        notes: row.notes,
        confirmedAt: row.created_at ? new Date(row.created_at).toLocaleTimeString('pt-BR') : '-',
      });
    });

    updateTotalDisplay();
  } catch (error) {
    console.error('Failed to load orders for table', currentTableNumber, error);
  }
};

const sendOrderData = async (orderData) => {
  try {
    const tableNumber = getTableNumber();
    
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...orderData,
        table_number: tableNumber,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error ? `${result.error}${result.detail ? `: ${result.detail}` : ''}` : `Status ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error('Order save failed:', error);
    return null;
  }
};

// Update total in header based on order history
const updateTotalDisplay = () => {
  let total = 0;
  
  orderHistory.forEach((order) => {
    total += order.total;
  });

  totalValueSpan.textContent = `Total: ${formatPrice(total)}`;
};

// Update modal summary
const updateModalSummary = () => {
  const items = Object.values(currentModalItems);
  
  if (items.length === 0) {
    modalSummary.style.display = 'none';
    return;
  }

  let total = 0;
  items.forEach((item) => {
    total += item.total;
  });

  modalOrderTotal.textContent = formatPrice(total);
  modalSummary.style.display = 'block';
};

// Add item to current modal
const addToCurrentModal = (item, quantity, notes) => {
  const modalKey = `${item.id}-${notes}`;
  
  if (currentModalItems[modalKey]) {
    currentModalItems[modalKey].quantity += quantity;
  } else {
    currentModalItems[modalKey] = {
      id: item.id,
      name: item.name,
      price: Number(item.price),
      quantity: quantity,
      notes: notes,
      image_url: item.image_url,
    };
  }
  
  currentModalItems[modalKey].total = Number((currentModalItems[modalKey].price * currentModalItems[modalKey].quantity).toFixed(2));
  updateModalSummary();
};

// Confirm all items in current modal
const confirmModalOrder = async () => {
  const items = Object.entries(currentModalItems);
  
  if (items.length === 0) {
    alert('Adicione itens antes de confirmar.');
    return;
  }

  console.log('Confirming modal order with items:', items.length);
  
  let allSuccessful = true;
  const confirmedOrders = [];

  for (const [cartKey, item] of items) {
    const orderData = {
      itemId: item.id,
      itemName: item.name,
      price: item.price,
      quantity: item.quantity,
      notes: item.notes,
      total: item.total,
    };

    console.log('Sending order data:', orderData);
    
    const result = await sendOrderData(orderData);
    if (result) {
      console.log('Order saved successfully:', result);
      // Add to confirmed orders list
      confirmedOrders.push({
        ...item,
        confirmedAt: new Date().toLocaleTimeString('pt-BR'),
      });
    } else {
      console.error('Failed to save order for item:', item.name);
      allSuccessful = false;
    }
  }

  if (allSuccessful && confirmedOrders.length > 0) {
    await loadTableOrders();
    
    alert('Pedido confirmado com sucesso!');
    updateTotalDisplay();
    
    // Clear current modal items
    Object.keys(currentModalItems).forEach(key => delete currentModalItems[key]);
    updateModalSummary();
    
    // Close modal
    closeItemModal();
  } else if (!allSuccessful) {
    alert('Erro ao confirmar alguns itens. Tente novamente.');
  }
};

// Render order history
const renderOrderHistory = () => {
  cartList.innerHTML = '';
  
  if (orderHistory.length === 0) {
    renderEmptyState('Nenhum pedido confirmado nesta sessão', cartList);
    const existingSummary = cartModal.querySelector('.cart-total-value');
    if (existingSummary) {
      existingSummary.textContent = formatPrice(0);
    }
    return;
  }

  orderHistory.forEach((order, index) => {
    const orderItemDiv = document.createElement('div');
    orderItemDiv.className = 'order-history-item';
    orderItemDiv.style.cssText = `
      background: #FFFFFF;
      border: 1px solid #E8E8E8;
      border-radius: 12px;
      padding: 14px;
      margin-bottom: 12px;
    `;

    const itemHeader = document.createElement('div');
    itemHeader.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;';

    const itemName = document.createElement('h4');
    itemName.style.cssText = 'margin: 0; font-size: 1.1rem; font-weight: 700; color: #2C2C2C;';
    itemName.textContent = order.name;

    const itemTime = document.createElement('span');
    itemTime.style.cssText = 'font-size: 0.85rem; color: #999;';
    itemTime.textContent = order.confirmedAt;

    itemHeader.append(itemName, itemTime);

    const itemDetails = document.createElement('p');
    itemDetails.style.cssText = 'margin: 0 0 6px 0; font-size: 0.9rem; color: #666;';
    itemDetails.textContent = `Qtd: ${order.quantity} × ${formatPrice(order.price)} = ${formatPrice(order.total)}`;

    let content = [itemHeader, itemDetails];

    if (order.notes && order.notes !== '-') {
      const notesText = document.createElement('p');
      notesText.style.cssText = 'margin: 6px 0 0 0; font-size: 0.85rem; color: #999; font-style: italic;';
      notesText.textContent = `Obs: ${order.notes}`;
      content.push(notesText);
    }

    content.forEach(el => orderItemDiv.append(el));
    cartList.append(orderItemDiv);
  });

  const existingSummary = cartModal.querySelector('.cart-total-value');
  const cartTotal = orderHistory.reduce((sum, order) => sum + order.total, 0);
  if (existingSummary) {
    existingSummary.textContent = formatPrice(cartTotal);
  }
};

// Open cart/history modal
const openCartModal = () => {
  renderOrderHistory();
  cartModal.classList.add('modal-open');
  cartModal.setAttribute('aria-hidden', 'false');
};

// Close cart modal
const closeCartModal = () => {
  cartModal.classList.remove('modal-open');
  cartModal.setAttribute('aria-hidden', 'true');
};

menuButton.addEventListener('click', () => {
  menuContainer.classList.toggle('mostrarCardapio');
  menuContainer.classList.toggle('esconderCardapio');
});

comandaButton.addEventListener('click', openCartModal);

// Bind waiter (chamar garçon) button to call waiter API
const waiterButton = document.querySelector('.botaoMenuGarcon');
const callWaiter = async () => {
  try {
    const tableNumber = getTableNumber();
    const resp = await fetch('/api/call-waiter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table_number: tableNumber }),
    });

    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || data.detail || `Status ${resp.status}`);
    alert('Garçon chamado com sucesso!');
  } catch (err) {
    console.error('Failed to call waiter:', err);
    alert('Falha ao chamar o garçon. Tente novamente.');
  }
};

if (waiterButton) {
  waiterButton.addEventListener('click', callWaiter);
}

const closeItemModal = () => {
  modal.classList.remove('modal-open');
  modal.setAttribute('aria-hidden', 'true');
  cardsList.innerHTML = '';
};

const openCategoryModal = async (category) => {
  console.log('openCategoryModal()', category);
  
  // Clear current modal items when opening new category
  Object.keys(currentModalItems).forEach(key => delete currentModalItems[key]);
  
  modalTitle.textContent = category;
  cardsList.innerHTML = '';

  // show loading state
  const loading = document.createElement('div');
  loading.className = 'empty-state';
  loading.textContent = 'Carregando...';
  cardsList.append(loading);

  const items = await fetchCategoryItems(category);
  // remove loading
  loading.remove();

  if (items === null) {
    renderEmptyState('Falha ao carregar os itens. Verifique a conexão com o servidor.', cardsList);
    modal.classList.add('modal-open');
    modal.setAttribute('aria-hidden', 'false');
    return;
  }

  if (items.length === 0) {
    renderEmptyState('Nenhum item encontrado nesta categoria.', cardsList);
    modal.classList.add('modal-open');
    modal.setAttribute('aria-hidden', 'false');
    return;
  }

  items.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'item-card';

    const itemPrice = Number(item.price);

    const image = document.createElement('img');
    image.className = 'card-image';
    image.src = getItemImageUrl(item);
    image.alt = item.name;
    image.loading = 'lazy';
    image.onerror = () => {
      if (image.src !== fallbackImageUrl) {
        image.src = fallbackImageUrl;
      }
    };

    const cardInfo = document.createElement('div');
    cardInfo.className = 'card-info';

    const title = document.createElement('h4');
    title.className = 'card-title';
    title.textContent = item.name;

    const priceLabel = document.createElement('p');
    priceLabel.className = 'card-price';
    priceLabel.textContent = formatPrice(itemPrice);

    const description = document.createElement('p');
    description.className = 'card-description';
    description.textContent = item.description || '';

    const notesLabel = document.createElement('label');
    notesLabel.textContent = 'Observações';

    const notesInput = document.createElement('textarea');
    notesInput.className = 'card-notes';
    notesInput.placeholder = 'Adicionar observações...';

    const cardActions = document.createElement('div');
    cardActions.className = 'card-actions';

    const quantityControls = document.createElement('div');
    quantityControls.className = 'quantity-controls';

    const decreaseBtn = document.createElement('button');
    decreaseBtn.type = 'button';
    decreaseBtn.className = 'qty-btn qty-decrease';
    decreaseBtn.textContent = '-';

    const quantityValue = document.createElement('span');
    quantityValue.className = 'qty-value';
    quantityValue.textContent = '0';

    const increaseBtn = document.createElement('button');
    increaseBtn.type = 'button';
    increaseBtn.className = 'qty-btn qty-increase';
    increaseBtn.textContent = '+';

    quantityControls.append(decreaseBtn, quantityValue, increaseBtn);

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'confirm-order-btn';
    addBtn.textContent = 'Adicionar';

    cardActions.append(quantityControls, addBtn);
    cardInfo.append(title, priceLabel, description, notesLabel, notesInput, cardActions);
    card.append(image, cardInfo);
    cardsList.append(card);

    let quantity = 0;

    const updateCardQuantity = () => {
      quantityValue.textContent = quantity;
    };

    decreaseBtn.addEventListener('click', () => {
      if (quantity > 0) {
        quantity -= 1;
        updateCardQuantity();
      }
    });

    increaseBtn.addEventListener('click', () => {
      quantity += 1;
      updateCardQuantity();
    });

    addBtn.addEventListener('click', () => {
      if (quantity === 0) {
        alert('Selecione ao menos 1 item antes de adicionar.');
        return;
      }

      const notes = notesInput.value.trim() || '-';
      addToCurrentModal(item, quantity, notes);
      
      // Reset form
      quantity = 0;
      updateCardQuantity();
      notesInput.value = '';
    });
  });

  updateModalSummary();
  modal.classList.add('modal-open');
  modal.setAttribute('aria-hidden', 'false');
};

categoryButtons.forEach((button) => {
  button.addEventListener('click', () => {
    console.log('categoriaPratos clicked:', button.textContent.trim());
    openCategoryModal(button.textContent.trim());
  });
});

// Bind the confirm button after DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  const initialTable = getTableNumberFromUrl();
  setTableNumber(initialTable);

  const modalConfirmBtn = modal.querySelector('.modal-confirm-btn');
  if (modalConfirmBtn) {
    console.log('Modal confirm button found, attaching listener');
    modalConfirmBtn.addEventListener('click', confirmModalOrder);
  } else {
    console.error('Modal confirm button not found!');
  }

  await loadTableOrders();
});

// Also try binding immediately
const modalConfirmBtn = modal.querySelector('.modal-confirm-btn');
if (modalConfirmBtn) {
  console.log('Modal confirm button found immediately, attaching listener');
  modalConfirmBtn.addEventListener('click', confirmModalOrder);
}

closeModalButton.addEventListener('click', closeItemModal);
cartCloseButton.addEventListener('click', closeCartModal);

modal.addEventListener('click', (event) => {
  if (event.target === modal) {
    closeItemModal();
  }
});

cartModal.addEventListener('click', (event) => {
  if (event.target === cartModal) {
    closeCartModal();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (modal.classList.contains('modal-open')) {
      closeItemModal();
    }
    if (cartModal.classList.contains('modal-open')) {
      closeCartModal();
    }
  }
});

// Initialize total display
updateTotalDisplay();

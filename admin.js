const qrGrid = document.getElementById('qrGrid');
const ordersTableBody = document.getElementById('ordersTableBody');
const totalOrdersCount = document.getElementById('totalOrdersCount');
const grandTotalValue = document.getElementById('grandTotalValue');
const refreshOrders = document.getElementById('refreshOrders');

const formatPrice = (value) => `R$ ${value.toFixed(2).replace('.', ',')}`;
const appBaseUrl = `${window.location.origin}${window.location.pathname.replace(/admin\.html$/, '')}`;
const tableCount = 10;

const createQrCard = (tableNumber) => {
  const url = `${window.location.origin}${window.location.pathname.replace(/admin\.html$/, '')}?table=${tableNumber}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(url)}`;

  const card = document.createElement('div');
  card.className = 'qr-card';

  const image = document.createElement('img');
  image.src = qrUrl;
  image.alt = `QR code Mesa ${tableNumber}`;

  const label = document.createElement('p');
  label.textContent = `Mesa ${tableNumber}`;

  const link = document.createElement('a');
  link.href = url;
  link.textContent = 'Abrir app';
  link.target = '_blank';

  card.append(image, label, link);
  return card;
};

const renderQrCodes = () => {
  qrGrid.innerHTML = '';
  for (let i = 1; i <= tableCount; i += 1) {
    qrGrid.append(createQrCard(i));
  }
};

const loadOrders = async () => {
  try {
    const response = await fetch('/api/orders');
    if (!response.ok) {
      throw new Error(`Falha ao carregar pedidos: ${response.status}`);
    }

    const rows = await response.json();
    ordersTableBody.innerHTML = '';

    let total = 0;
    rows.forEach((row) => {
      const tr = document.createElement('tr');

      const createdAt = row.created_at ? new Date(row.created_at).toLocaleTimeString('pt-BR') : '-';
      const itemName = row.item_name || row.item_id;
      const priceEach = Number(row.price_each || 0);
      const totalPrice = Number(row.total_price || 0);
      total += totalPrice;

      tr.innerHTML = `
        <td>${row.table_number || '-'}</td>
        <td>${itemName}</td>
        <td>${row.quantity}</td>
        <td>${formatPrice(priceEach)}</td>
        <td>${formatPrice(totalPrice)}</td>
        <td>${row.notes || '-'}</td>
        <td>${createdAt}</td>
      `;

      ordersTableBody.appendChild(tr);
    });

    totalOrdersCount.textContent = `${rows.length} pedido${rows.length === 1 ? '' : 's'}`;
    grandTotalValue.textContent = `Total: ${formatPrice(total)}`;
  } catch (error) {
    console.error(error);
    ordersTableBody.innerHTML = '<tr><td colspan="7">Falha ao carregar os pedidos.</td></tr>';
  }
};

refreshOrders.addEventListener('click', loadOrders);

renderQrCodes();
loadOrders();

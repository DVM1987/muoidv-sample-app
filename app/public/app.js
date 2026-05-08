const dbStatus = document.getElementById('db-status');
const btnDbTest = document.getElementById('btn-db-test');
const formAdd = document.getElementById('form-add');
const addStatus = document.getElementById('add-status');
const btnRefresh = document.getElementById('btn-refresh');
const productTableBody = document.querySelector('#product-table tbody');

btnDbTest.addEventListener('click', async () => {
  dbStatus.textContent = 'checking...';
  try {
    const res = await fetch('/api/db-test');
    const data = await res.json();
    dbStatus.textContent = JSON.stringify(data, null, 2);
    dbStatus.className = data.status === 'connected' ? 'success' : 'error';
  } catch (err) {
    dbStatus.textContent = `error: ${err.message}`;
    dbStatus.className = 'error';
  }
});

formAdd.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('input-name').value;
  const price = document.getElementById('input-price').value;
  addStatus.textContent = 'adding...';
  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, price }),
    });
    const data = await res.json();
    if (res.ok) {
      addStatus.textContent = `added: ${JSON.stringify(data)}`;
      addStatus.className = 'success';
      formAdd.reset();
      loadProducts();
    } else {
      addStatus.textContent = `error: ${data.error}`;
      addStatus.className = 'error';
    }
  } catch (err) {
    addStatus.textContent = `error: ${err.message}`;
    addStatus.className = 'error';
  }
});

btnRefresh.addEventListener('click', loadProducts);

async function loadProducts() {
  try {
    const res = await fetch('/api/products');
    const products = await res.json();
    productTableBody.innerHTML = products
      .map(
        (p) =>
          `<tr><td>${p.id}</td><td>${p.name}</td><td>${p.price}</td><td>${new Date(p.created_at).toLocaleString()}</td></tr>`
      )
      .join('');
  } catch (err) {
    productTableBody.innerHTML = `<tr><td colspan="4" class="error">error: ${err.message}</td></tr>`;
  }
}

loadProducts();

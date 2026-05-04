const STORAGE_KEYS = {
  products: "depot-bintang-products",
  orders: "depot-bintang-orders",
  admin: "depot-bintang-admin",
};

const ADMIN = {
  email: "admin@bintang.local",
  password: "bintang2026",
};

const DEFAULT_PRODUCTS = [
  {
    id: "galon-mineral",
    name: "Galon Bintang Mineral",
    size: "19 liter",
    price: 18000,
    stock: 42,
    theme: "mineral",
    description: "Air mineral segar untuk pemakaian harian keluarga.",
  },
  {
    id: "galon-alkali",
    name: "Galon Bintang Alkali",
    size: "19 liter",
    price: 23000,
    stock: 28,
    theme: "alkali",
    description: "Air alkali premium dengan rasa lembut dan bersih.",
  },
  {
    id: "paket-dispenser",
    name: "Paket Galon + Dispenser",
    size: "1 galon + sewa dispenser",
    price: 52000,
    stock: 12,
    theme: "dispenser",
    description: "Paket awal untuk rumah baru, kantor kecil, atau event.",
  },
];

const DEFAULT_ORDERS = [
  {
    id: "ORD-260504-001",
    productId: "galon-mineral",
    customerName: "Rina Putri",
    customerPhone: "081234567890",
    quantity: 2,
    address: "Jl. Melati No. 14, dekat minimarket",
    status: "Diproses",
    createdAt: "2026-05-04T08:30:00+07:00",
  },
  {
    id: "ORD-260504-002",
    productId: "galon-alkali",
    customerName: "Budi Santoso",
    customerPhone: "082112223333",
    quantity: 1,
    address: "Komplek Taman Sari Blok C2",
    status: "Diantar",
    createdAt: "2026-05-04T09:15:00+07:00",
  },
];

const state = {
  products: [],
  orders: [],
  selectedProductId: "galon-mineral",
  currentRoute: "order",
  adminTab: "dashboard",
};

let refreshParallax = () => {};

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const productAssets = {
  mineral: "assets/galon-mineral.svg",
  alkali: "assets/galon-alkali.svg",
  dispenser: "assets/paket-dispenser.svg",
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[char];
  });
}

function readStore(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeStore(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function seedData(force = false) {
  if (force || !localStorage.getItem(STORAGE_KEYS.products)) {
    writeStore(STORAGE_KEYS.products, DEFAULT_PRODUCTS);
  }

  if (force || !localStorage.getItem(STORAGE_KEYS.orders)) {
    writeStore(STORAGE_KEYS.orders, DEFAULT_ORDERS);
  }
}

function loadData() {
  seedData(false);
  state.products = readStore(STORAGE_KEYS.products, DEFAULT_PRODUCTS);
  state.orders = readStore(STORAGE_KEYS.orders, DEFAULT_ORDERS);
}

function saveProducts() {
  writeStore(STORAGE_KEYS.products, state.products);
}

function saveOrders() {
  writeStore(STORAGE_KEYS.orders, state.orders);
}

function byId(id) {
  return document.getElementById(id);
}

function money(value) {
  return rupiah.format(value || 0);
}

function getProduct(productId) {
  return state.products.find((product) => product.id === productId);
}

function icon(name) {
  const icons = {
    edit: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"/></svg>',
    trash: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>',
    check: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>',
  };

  return icons[name] || "";
}

function toast(message) {
  const toastEl = byId("toast");
  toastEl.textContent = message;
  toastEl.classList.add("show");
  window.setTimeout(() => toastEl.classList.remove("show"), 2800);
}

function uid(prefix) {
  const date = new Date();
  const stamp = date
    .toISOString()
    .slice(2, 10)
    .replaceAll("-", "");
  const serial = String(Date.now()).slice(-4);
  return `${prefix}-${stamp}-${serial}`;
}

function normalizePhone(value) {
  return value.replace(/[^\d+]/g, "");
}

function renderProductSelect() {
  const select = byId("orderProduct");
  if (!getProduct(state.selectedProductId)) {
    state.selectedProductId = state.products[0]?.id || "";
  }

  select.innerHTML = state.products
    .map((product) => {
      const selected = product.id === state.selectedProductId ? "selected" : "";
      return `<option value="${escapeHtml(product.id)}" ${selected}>${escapeHtml(product.name)} - ${money(product.price)}</option>`;
    })
    .join("");
}

function updateOrderTotal() {
  const product = getProduct(byId("orderProduct").value);
  const quantity = Number(byId("quantity").value || 1);
  byId("orderTotal").textContent = money((product?.price || 0) * quantity);
}

function renderProductScenes() {
  const stage = byId("productStage");

  if (!state.products.length) {
    stage.innerHTML = `
      <section class="product-scene scene-mineral">
        <div class="scene-copy glass-panel">
          <p class="eyebrow">Produk kosong</p>
          <h1>Belum ada produk</h1>
          <p>Tambahkan produk dari dashboard admin.</p>
        </div>
      </section>
    `;
    refreshParallax();
    return;
  }

  stage.innerHTML = state.products
    .map((product, index) => {
      const titleTag = index === 0 ? "h1" : "h2";
      const sceneClass = `scene-${["mineral", "alkali", "dispenser"].includes(product.theme) ? product.theme : "mineral"}`;
      const eyebrow = product.theme === "alkali" ? "pH seimbang" : product.theme === "dispenser" ? "Paket hemat" : "Mineral segar";
      return `
        <section class="product-scene ${sceneClass}" data-product-id="${escapeHtml(product.id)}">
          <div class="scene-media" aria-hidden="true">
            <img src="${productAssets[product.theme] || productAssets.mineral}" alt="" />
          </div>
          <div class="scene-copy glass-panel">
            <p class="eyebrow">${eyebrow}</p>
            <${titleTag}>${escapeHtml(product.name)}</${titleTag}>
            <p>${escapeHtml(product.description)}</p>
            <div class="scene-actions">
              <button class="primary-btn choose-product" type="button" data-product-id="${escapeHtml(product.id)}">
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
                Pesan Sekarang
              </button>
              <span class="price-badge">${money(product.price)}</span>
            </div>
          </div>
        </section>
      `;
    })
    .join("");

  refreshParallax();
}

function renderOrderCard(order) {
  const product = getProduct(order.productId);
  const total = (product?.price || 0) * order.quantity;
  return `
    <article class="order-card">
      <header>
        <div>
          <h3>${escapeHtml(order.id)} - ${escapeHtml(order.customerName)}</h3>
          <p>${escapeHtml(product?.name || "Produk terhapus")} (${order.quantity}x) - ${money(total)}</p>
        </div>
        <span class="status ${escapeHtml(order.status)}">${escapeHtml(order.status)}</span>
      </header>
      <p>${escapeHtml(order.address)}</p>
      <p>${new Date(order.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</p>
    </article>
  `;
}

function renderTracker(results = []) {
  const wrap = byId("trackResults");
  if (!results.length) {
    wrap.innerHTML = '<article class="order-card"><p>Belum ada pesanan untuk nomor ini.</p></article>';
    return;
  }

  wrap.innerHTML = results.map(renderOrderCard).join("");
}

function renderMetrics() {
  const revenue = state.orders.reduce((sum, order) => {
    if (order.status === "Batal") return sum;
    const product = getProduct(order.productId);
    return sum + (product?.price || 0) * order.quantity;
  }, 0);
  const processing = state.orders.filter((order) => ["Menunggu", "Diproses", "Diantar"].includes(order.status)).length;

  byId("metricOrders").textContent = state.orders.length;
  byId("metricRevenue").textContent = money(revenue);
  byId("metricProcess").textContent = processing;
  byId("metricProducts").textContent = state.products.length;
}

function renderRecentOrders() {
  const recent = [...state.orders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4);
  byId("recentOrders").innerHTML = recent.length
    ? recent.map(renderOrderCard).join("")
    : '<article class="order-card"><p>Belum ada pesanan.</p></article>';
}

function renderStockList() {
  byId("stockList").innerHTML = state.products
    .map((product) => {
      const width = Math.min(100, Math.round((product.stock / 50) * 100));
      return `
        <div class="stock-item">
          <div class="stock-row">
            <span>${escapeHtml(product.name)}</span>
            <span>${product.stock}</span>
          </div>
          <div class="stock-bar" style="--stock-width:${width}%"><span></span></div>
        </div>
      `;
    })
    .join("");
}

function renderProductsTable() {
  const rows = state.products
    .map(
      (product) => `
      <tr>
        <td><strong>${escapeHtml(product.name)}</strong><br><small>${escapeHtml(product.description)}</small></td>
        <td>${escapeHtml(product.size)}</td>
        <td>${money(product.price)}</td>
        <td>${product.stock}</td>
        <td>${escapeHtml(product.theme)}</td>
        <td>
          <div class="table-actions">
            <button class="mini-btn edit-product" type="button" data-id="${escapeHtml(product.id)}" aria-label="Edit ${escapeHtml(product.name)}" title="Edit">${icon("edit")}</button>
            <button class="mini-btn danger delete-product" type="button" data-id="${escapeHtml(product.id)}" aria-label="Hapus ${escapeHtml(product.name)}" title="Hapus">${icon("trash")}</button>
          </div>
        </td>
      </tr>
    `
    )
    .join("");

  byId("productsTable").innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Produk</th>
          <th>Ukuran</th>
          <th>Harga</th>
          <th>Stok</th>
          <th>Tema</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>${rows || '<tr><td colspan="6">Belum ada produk.</td></tr>'}</tbody>
    </table>
  `;
}

function renderOrdersTable() {
  const filter = byId("statusFilter").value;
  const filtered = state.orders.filter((order) => filter === "all" || order.status === filter);
  const rows = filtered
    .map((order) => {
      const product = getProduct(order.productId);
      const total = (product?.price || 0) * order.quantity;
      return `
        <tr>
          <td><strong>${escapeHtml(order.id)}</strong><br><small>${new Date(order.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</small></td>
          <td>${escapeHtml(order.customerName)}<br><small>${escapeHtml(order.customerPhone)}</small></td>
          <td>${escapeHtml(product?.name || "Produk terhapus")}<br><small>${order.quantity}x - ${money(total)}</small></td>
          <td>${escapeHtml(order.address)}</td>
          <td>
            <select class="order-status" data-id="${escapeHtml(order.id)}" aria-label="Status ${escapeHtml(order.id)}">
              ${["Menunggu", "Diproses", "Diantar", "Selesai", "Batal"]
                .map((status) => `<option value="${status}" ${status === order.status ? "selected" : ""}>${status}</option>`)
                .join("")}
            </select>
          </td>
          <td>
            <div class="table-actions">
              <button class="mini-btn complete-order" type="button" data-id="${escapeHtml(order.id)}" aria-label="Selesaikan ${escapeHtml(order.id)}" title="Selesai">${icon("check")}</button>
              <button class="mini-btn danger delete-order" type="button" data-id="${escapeHtml(order.id)}" aria-label="Hapus ${escapeHtml(order.id)}" title="Hapus">${icon("trash")}</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  byId("ordersTable").innerHTML = `
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Pelanggan</th>
          <th>Pesanan</th>
          <th>Alamat</th>
          <th>Status</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>${rows || '<tr><td colspan="6">Tidak ada pesanan.</td></tr>'}</tbody>
    </table>
  `;
}

function renderAdmin() {
  renderMetrics();
  renderRecentOrders();
  renderStockList();
  renderProductsTable();
  renderOrdersTable();
}

function renderAll() {
  renderProductScenes();
  renderProductSelect();
  updateOrderTotal();
  renderAdmin();
}

function fillProductForm(product) {
  byId("productId").value = product?.id || "";
  byId("productName").value = product?.name || "";
  byId("productSize").value = product?.size || "";
  byId("productPrice").value = product?.price || "";
  byId("productStock").value = product?.stock || "";
  byId("productTheme").value = product?.theme || "mineral";
  byId("productDescription").value = product?.description || "";
}

function createOrder(event) {
  event.preventDefault();
  const product = getProduct(byId("orderProduct").value);
  const quantity = Number(byId("quantity").value || 1);

  if (!product) {
    toast("Produk tidak ditemukan.");
    return;
  }

  if (quantity > product.stock) {
    toast("Stok produk tidak cukup.");
    return;
  }

  const order = {
    id: byId("orderId").value || uid("ORD"),
    productId: product.id,
    customerName: byId("customerName").value.trim(),
    customerPhone: normalizePhone(byId("customerPhone").value),
    quantity,
    address: byId("address").value.trim(),
    status: "Menunggu",
    createdAt: new Date().toISOString(),
  };

  product.stock -= quantity;
  state.orders.unshift(order);
  saveProducts();
  saveOrders();
  event.target.reset();
  byId("quantity").value = 1;
  state.selectedProductId = product.id;
  renderAll();
  toast(`Pesanan ${order.id} berhasil dibuat.`);
}

function saveProduct(event) {
  event.preventDefault();
  const id = byId("productId").value || byId("productName").value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const product = {
    id,
    name: byId("productName").value.trim(),
    size: byId("productSize").value.trim(),
    price: Number(byId("productPrice").value || 0),
    stock: Number(byId("productStock").value || 0),
    theme: byId("productTheme").value,
    description: byId("productDescription").value.trim(),
  };

  const existingIndex = state.products.findIndex((item) => item.id === id);
  if (existingIndex >= 0) {
    state.products[existingIndex] = product;
  } else {
    state.products.push(product);
  }

  saveProducts();
  fillProductForm();
  renderAll();
  toast("Produk berhasil disimpan.");
}

function deleteProduct(id) {
  const used = state.orders.some((order) => order.productId === id);
  if (used) {
    toast("Produk masih dipakai oleh pesanan.");
    return;
  }

  state.products = state.products.filter((product) => product.id !== id);
  saveProducts();
  renderAll();
  toast("Produk berhasil dihapus.");
}

function deleteOrder(id) {
  const order = state.orders.find((item) => item.id === id);
  if (order && order.status !== "Batal") {
    const product = getProduct(order.productId);
    if (product) product.stock += order.quantity;
  }

  state.orders = state.orders.filter((item) => item.id !== id);
  saveProducts();
  saveOrders();
  renderAll();
  toast("Pesanan berhasil dihapus.");
}

function updateOrderStatus(id, status) {
  const order = state.orders.find((item) => item.id === id);
  if (!order) return;
  const previousStatus = order.status;
  const product = getProduct(order.productId);

  if (previousStatus !== "Batal" && status === "Batal" && product) {
    product.stock += order.quantity;
  }

  if (previousStatus === "Batal" && status !== "Batal" && product) {
    if (product.stock < order.quantity) {
      toast("Stok produk tidak cukup untuk mengaktifkan pesanan.");
      renderOrdersTable();
      return;
    }
    product.stock -= order.quantity;
  }

  order.status = status;
  saveProducts();
  saveOrders();
  renderAll();
  toast(`Status ${id} menjadi ${status}.`);
}

function setRoute(route) {
  state.currentRoute = route;
  document.querySelectorAll(".route").forEach((section) => {
    section.classList.toggle("active", section.dataset.page === route);
  });
  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.classList.toggle("active", link.dataset.route === route);
  });
  document.querySelector(".nav-links").classList.remove("open");
}

function setAdminTab(tab) {
  state.adminTab = tab;
  document.querySelectorAll(".tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.adminTab === tab);
  });
  document.querySelectorAll(".admin-page").forEach((panel) => {
    panel.classList.toggle("active", panel.id === `${tab}Panel`);
  });
}

function isAdminLoggedIn() {
  return localStorage.getItem(STORAGE_KEYS.admin) === "true";
}

function refreshAdminAuth() {
  const loggedIn = isAdminLoggedIn();
  byId("loginPanel").classList.toggle("hidden", loggedIn);
  byId("adminPanel").classList.toggle("hidden", !loggedIn);
  byId("logoutBtn").classList.toggle("hidden", !loggedIn);
}

function setupParallax() {
  const stage = byId("productStage");
  const update = () => {
    const viewport = window.innerHeight || 1;
    document.querySelectorAll(".product-scene").forEach((scene) => {
      const rect = scene.getBoundingClientRect();
      const centerDelta = rect.top + rect.height / 2 - viewport / 2;
      scene.style.setProperty("--parallax", `${centerDelta}px`);
      const scale = 1 + Math.max(0, 1 - Math.abs(centerDelta) / viewport) * 0.04;
      scene.style.setProperty("--media-scale", scale.toFixed(3));
    });
  };

  refreshParallax = update;
  stage.addEventListener("scroll", () => requestAnimationFrame(update), { passive: true });
  window.addEventListener("resize", update);
  update();
}

function bindEvents() {
  byId("menuToggle").addEventListener("click", () => {
    document.querySelector(".nav-links").classList.toggle("open");
  });

  byId("collapseOrder").addEventListener("click", () => {
    byId("collapseOrder").closest(".order-dock").classList.toggle("collapsed");
  });

  byId("productStage").addEventListener("click", (event) => {
    const button = event.target.closest(".choose-product");
    if (!button) return;

    state.selectedProductId = button.dataset.productId;
    byId("orderProduct").value = state.selectedProductId;
    byId("collapseOrder").closest(".order-dock").classList.remove("collapsed");
    updateOrderTotal();
    byId("customerName").focus();
  });

  window.addEventListener("hashchange", () => setRoute(location.hash.replace("#", "") || "order"));
  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.addEventListener("click", () => setRoute(link.dataset.route));
  });

  byId("orderProduct").addEventListener("change", updateOrderTotal);
  byId("quantity").addEventListener("input", updateOrderTotal);
  byId("orderForm").addEventListener("submit", createOrder);

  byId("trackForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const phone = normalizePhone(byId("trackPhone").value);
    renderTracker(state.orders.filter((order) => order.customerPhone === phone));
  });

  byId("loginForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const email = byId("adminEmail").value.trim();
    const password = byId("adminPassword").value;
    if (email === ADMIN.email && password === ADMIN.password) {
      localStorage.setItem(STORAGE_KEYS.admin, "true");
      refreshAdminAuth();
      renderAdmin();
      toast("Berhasil masuk dashboard.");
      return;
    }
    toast("Email atau password salah.");
  });

  byId("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEYS.admin);
    refreshAdminAuth();
    toast("Anda keluar dari dashboard.");
  });

  byId("seedBtn").addEventListener("click", () => {
    seedData(true);
    loadData();
    renderAll();
    toast("Data demo sudah direset.");
  });

  document.querySelectorAll(".tab").forEach((button) => {
    button.addEventListener("click", () => setAdminTab(button.dataset.adminTab));
  });

  byId("productForm").addEventListener("submit", saveProduct);
  byId("cancelProductEdit").addEventListener("click", () => fillProductForm());
  byId("statusFilter").addEventListener("change", renderOrdersTable);

  document.addEventListener("click", (event) => {
    const editProduct = event.target.closest(".edit-product");
    if (editProduct) {
      const product = getProduct(editProduct.dataset.id);
      fillProductForm(product);
      setAdminTab("products");
      byId("productName").focus();
      return;
    }

    const deleteProductBtn = event.target.closest(".delete-product");
    if (deleteProductBtn) {
      deleteProduct(deleteProductBtn.dataset.id);
      return;
    }

    const completeOrder = event.target.closest(".complete-order");
    if (completeOrder) {
      updateOrderStatus(completeOrder.dataset.id, "Selesai");
      return;
    }

    const deleteOrderBtn = event.target.closest(".delete-order");
    if (deleteOrderBtn) {
      deleteOrder(deleteOrderBtn.dataset.id);
    }
  });

  document.addEventListener("change", (event) => {
    const statusSelect = event.target.closest(".order-status");
    if (statusSelect) {
      updateOrderStatus(statusSelect.dataset.id, statusSelect.value);
    }
  });
}

function boot() {
  loadData();
  bindEvents();
  renderAll();
  refreshAdminAuth();
  setAdminTab("dashboard");
  setRoute(location.hash.replace("#", "") || "order");
  setupParallax();
}

boot();

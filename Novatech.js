function showSection(sectionId, el) {
  document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
  document.getElementById(sectionId).classList.add('active');
  document.getElementById("pageTitle").innerText =
    sectionId.charAt(0).toUpperCase() + sectionId.slice(1);

  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active-nav'));
  if (el) el.classList.add('active-nav');
}

let products = JSON.parse(localStorage.getItem("products")) || [];
let categories = JSON.parse(localStorage.getItem("categories")) || [];
let editId = null;


products = products.map(p => {
  if (!p.id) return { ...p, id: Date.now() + Math.random() };
  return p;
});
localStorage.setItem("products", JSON.stringify(products));

const productForm = document.getElementById("productForm");
const productList = document.getElementById("productList");
const searchInput = document.getElementById("searchInput");
const categoryList = document.getElementById("categoryList");
const apiProductList = document.getElementById("apiProductList");

function saveProducts() {
  localStorage.setItem("products", JSON.stringify(products));
}

function saveCategories() {
  localStorage.setItem("categories", JSON.stringify(categories));
}


async function loadAPIStore() {
  try {
    const res = await fetch("https://fakestoreapi.com/products");
    const data = await res.json();
    renderAPIProducts(data);
  } catch (err) {
    console.error("API Error:", err);
  }
}

function renderAPIProducts(apiProducts) {
  if (!apiProductList) return;
  apiProductList.innerHTML = "";

  apiProducts.forEach(p => {
    const li = document.createElement("li");

    const btn = document.createElement("button");
    btn.className = "btn-primary";
    btn.textContent = "Import";
    btn.addEventListener("click", () => importProduct(p));

    li.innerHTML = `
      <div style="display:flex; gap:15px; align-items:center;">
        <img src="${p.image}" style="width:60px; height:60px; object-fit:contain; background:#fff; padding:5px; border-radius:8px;">
        <div class="product-info">
          <strong>${p.title}</strong>
          <div>
            <span class="price">$${p.price}</span> • ${p.category}
          </div>
        </div>
      </div>
    `;

    const actions = document.createElement("div");
    actions.className = "actions";
    actions.appendChild(btn);

    li.appendChild(actions);
    apiProductList.appendChild(li);
  });
}

function importProduct(p) {
  let qty = prompt("Enter quantity to import:");
  if (qty === null) return;

  qty = Number(qty);
  if (isNaN(qty) || qty <= 0) {
    alert("Please enter a valid quantity.");
    return;
  }

  const cleanCategory =
    p.category.charAt(0).toUpperCase() + p.category.slice(1).toLowerCase();

const newProduct = {
  id: Date.now(),
  name: p.title,
  price: p.price,
  stock: qty,
  category: cleanCategory,
  description: p.description,
  image: p.image
};


  products.push(newProduct);

  if (!categories.includes(cleanCategory)) {
    categories.push(cleanCategory);
    saveCategories();
  }

  saveProducts();
  renderProducts();
  renderCategories();
  updateDashboard();

  alert("Product imported!");
}



function renderProducts(filtered = products) {
  productList.innerHTML = "";

  filtered.forEach((p) => {
    const li = document.createElement("li");

    let stockClass = p.stock <= 3 ? "stock-low" : "stock-ok";
    let stockText = p.stock <= 3 ? "Low Stock" : "In Stock";

    li.innerHTML = `
      <div class="product-info" onclick="openModal(${p.id})" style="cursor:pointer;">
        <strong>${p.name}</strong>
        <div>
          <span class="price">$${p.price}</span>
          • <span class="stock-badge ${stockClass}">${stockText}</span>
          • ${p.category}
        </div>
      </div>

      <div class="actions">
        <button class="action-btn" onclick="editProductById(${p.id})">✎</button>
        <button class="action-btn action-delete" onclick="confirmDeleteById(${p.id})">⌫</button>
      </div>
    `;

    productList.appendChild(li);
  });
}


function editProductById(id) {
  const index = products.findIndex(p => p.id === id);
  if (index === -1) return;

  const p = products[index];

  document.getElementById("name").value = p.name;
  document.getElementById("price").value = p.price;
  document.getElementById("stock").value = p.stock;
  document.getElementById("categorySelect").value = p.category;

  editId = id;
}

function confirmDeleteById(id) {
  if (!confirm("Delete this product?")) return;
  products = products.filter(p => p.id !== id);
  saveProducts();
  renderProducts();
  updateDashboard();
}



productForm.addEventListener("submit", function(e) {
  e.preventDefault();

  const description = document.getElementById("description").value;
  const price = document.getElementById("price").value;
  const stock = document.getElementById("stock").value;
  const category = document.getElementById("categorySelect").value;

  if (editId === null) {
 products.push({
  id: Date.now(),
  name,
  price,
  stock,
  category,
  description,
  image: "https://via.placeholder.com/300x300?text=No+Image"
});


  } else {
    const index = products.findIndex(p => p.id === editId);
    if (index !== -1) {
      products[index] = { id: editId, name, price, stock, category };
    }
    editId = null;
  }

  saveProducts();
  renderProducts();
  updateDashboard();
  productForm.reset();
});



searchInput.addEventListener("input", function() {
  const value = this.value.toLowerCase();
  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(value)
  );
  renderProducts(filtered);
});



function renderCategories() {
  categoryList.innerHTML = "";

  const select = document.getElementById("categorySelect");
  const filter = document.getElementById("filterCategory");

  if (select) select.innerHTML = `<option value="">Select category</option>`;
  if (filter) filter.innerHTML = `<option value="all">All Categories</option>`;

  categories.forEach((c, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${c}</span>
      <button class="action-btn action-delete" onclick="deleteCategory(${index})">⌫</button>
    `;
    categoryList.appendChild(li);

    if (select) {
      const option = document.createElement("option");
      option.value = c;
      option.textContent = c;
      select.appendChild(option);
    }

    if (filter) {
      const option = document.createElement("option");
      option.value = c;
      option.textContent = c;
      filter.appendChild(option);
    }
  });
}

function deleteCategory(index) {
  if (!confirm("Delete this category and all its products?")) return;

  const removedCategory = categories[index];
  categories.splice(index, 1);
  products = products.filter(p => p.category !== removedCategory);

  saveCategories();
  saveProducts();
  renderCategories();
  renderProducts();
  updateDashboard();
}



let stockChart = null;

function updateDashboard() {
  document.getElementById("totalProducts").innerText = products.length;

  let totalStock = 0;
  products.forEach(p => totalStock += Number(p.stock));
  document.getElementById("totalStock").innerText = totalStock;

  document.getElementById("totalCategories").innerText = categories.length;

  updateChart();
}

function updateChart() {
  const canvas = document.getElementById("stockChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  const categoryTotals = {};

  products.forEach(p => {
    if (!categoryTotals[p.category]) {
      categoryTotals[p.category] = 0;
    }
    categoryTotals[p.category] += Number(p.stock);
  });

  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);

  if (stockChart) stockChart.destroy();

  stockChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Stock",
        data
      }]
    }
  });
}



function filterByCategory() {
  const selected = document.getElementById("filterCategory").value;

  if (selected === "all") {
    renderProducts();
  } else {
    const filtered = products.filter(p => p.category === selected);
    renderProducts(filtered);
  }
}


let nameAsc = true;
let priceAsc = true;
let stockAsc = true;

function sortByName(btn) {
  products.sort((a, b) =>
    nameAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
  );
  nameAsc = !nameAsc;
  btn.innerText = nameAsc ? "A → Z" : "Z → A";
  renderProducts();
}

function sortByPrice(btn) {
  products.sort((a, b) =>
    priceAsc ? a.price - b.price : b.price - a.price
  );
  priceAsc = !priceAsc;
  btn.innerText = priceAsc ? "Price ↑" : "Price ↓";
  renderProducts();
}

function sortByStock(btn) {
  products.sort((a, b) =>
    stockAsc ? a.stock - b.stock : b.stock - a.stock
  );
  stockAsc = !stockAsc;
  btn.innerText = stockAsc ? "Stock ↑" : "Stock ↓";
  renderProducts();
}



(async function init() {
  await loadAPIStore();
  renderProducts();
  renderCategories();
  updateDashboard();
})();

const categoryForm = document.getElementById("categoryForm");

categoryForm.addEventListener("submit", function(e) {
  e.preventDefault();

  const input = document.getElementById("categoryName");
  const name = input.value.trim();

  if (!name) return;

  if (categories.includes(name)) {
    alert("Category already exists!");
    return;
  }

  categories.push(name);
  saveCategories();
  renderCategories();
  updateDashboard();

  input.value = "";
});

function openModal(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;

  document.getElementById("modalName").innerText = p.name;
  document.getElementById("modalDesc").innerText = p.description || "No description";
  document.getElementById("modalPrice").innerText = p.price;
  document.getElementById("modalStock").innerText = p.stock;
  document.getElementById("modalCategory").innerText = p.category;

  const img = document.getElementById("modalImage");
img.src = p.image || "https://via.placeholder.com/300x300?text=No+Image";
img.onerror = () => {
  img.src = "https://via.placeholder.com/300x300?text=No+Image";
};


  document.getElementById("productModal").style.display = "flex";
}


function closeModal() {
  document.getElementById("productModal").style.display = "none";
}

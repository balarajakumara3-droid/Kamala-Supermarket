/* ============================================
   KAMALA SUPERMARKET — Products JavaScript
   Product loading, filtering, search, rendering
   ============================================ */

const Products = {
  allProducts: [],
  allCategories: [],
  filteredProducts: [],
  currentFilters: {
    category: '',
    brand: '',
    priceRange: [0, 10000],
    search: '',
    sort: 'default',
    inStock: false
  },

  // Load products from JSON
  async loadProducts() {
    try {
      const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
      const response = await fetch(basePath + 'data/products.json');
      const data = await response.json();
      this.allProducts = data.products;
      this.allCategories = data.categories;
      this.filteredProducts = [...this.allProducts];
      return data;
    } catch (err) {
      console.error('Failed to load products:', err);
      return { products: [], categories: [] };
    }
  },

  // Filter products
  applyFilters() {
    let products = [...this.allProducts];

    // Category filter
    if (this.currentFilters.category) {
      products = products.filter(p => p.category === this.currentFilters.category);
    }

    // Brand filter
    if (this.currentFilters.brand) {
      products = products.filter(p => p.brand === this.currentFilters.brand);
    }

    // Price range filter
    products = products.filter(p => 
      p.price >= this.currentFilters.priceRange[0] && 
      p.price <= this.currentFilters.priceRange[1]
    );

    // Search filter
    if (this.currentFilters.search) {
      const query = this.currentFilters.search.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      );
    }

    // In stock filter
    if (this.currentFilters.inStock) {
      products = products.filter(p => p.stock);
    }

    // Sort
    switch (this.currentFilters.sort) {
      case 'price-low':
        products.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        products.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        products.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'discount':
        products.sort((a, b) => ((b.mrp - b.price) / b.mrp) - ((a.mrp - a.price) / a.mrp));
        break;
    }

    this.filteredProducts = products;
    this.updateSEO();
    return products;
  },

  // Dynamic SEO Page Title & Description Updates
  updateSEO() {
    const category = this.currentFilters.category;
    const search = this.currentFilters.search;
    const storeName = window.KS ? window.KS.CONFIG.storeName : 'Kamala Supermarket';

    let title = `All Products — ${storeName} | Shop Groceries Online Villupuram`;
    let description = `Browse our complete collection of fresh groceries and essentials at ${storeName}. Best prices, fast same-day delivery in Villupuram!`;

    if (category) {
      title = `${category} — Buy Fresh Groceries Online | ${storeName} Villupuram`;
      description = `Shop fresh, high-quality ${category.toLowerCase()} online at ${storeName}. Best rates and direct same-day home delivery in Villupuram!`;
    } else if (search) {
      const queryEscaped = search.replace(/"/g, '&quot;');
      title = `Search Results for "${search}" — ${storeName}`;
      description = `Browse matching results for "${queryEscaped}" at ${storeName} Villupuram. Find fresh groceries, snacks, household items, and more!`;
    }

    document.title = title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', description);
    }
  },

  // Get featured products
  getFeatured() {
    return this.allProducts.filter(p => p.featured);
  },

  // Get deal products
  getDeals() {
    return this.allProducts.filter(p => p.deal);
  },

  // Get products by category
  getByCategory(category) {
    return this.allProducts.filter(p => p.category === category);
  },

  // Get unique brands
  getBrands() {
    return [...new Set(this.allProducts.map(p => p.brand))].sort();
  },

  // Search products
  search(query) {
    this.currentFilters.search = query;
    return this.applyFilters();
  },

  // Render a single product card HTML
  renderCard(product) {
    const discount = product.mrp > product.price 
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100) 
      : 0;

    return `
      <div class="product-card reveal" data-id="${product.id}" data-category="${product.category}">
        ${discount > 0 ? `<span class="product-badge">${discount}% OFF</span>` : ''}
        ${!product.stock ? '<span class="product-badge out-of-stock">Out of Stock</span>' : ''}
        <div class="product-image">
          <img src="${product.image}" alt="${product.name}" loading="lazy" 
               onerror="this.src='https://via.placeholder.com/400x400/f3f4f6/9ca3af?text=${encodeURIComponent(product.name)}'">
          <div class="product-actions-overlay">
            <button onclick="Cart.addItem(Products.getById('${product.id}'))" title="Add to Cart">🛒</button>
            <button onclick="WhatsApp.orderProduct(Products.getById('${product.id}'))" title="Order on WhatsApp">💬</button>
          </div>
        </div>
        <div class="product-info">
          <div class="product-category">${product.subcategory || product.category}</div>
          <div class="product-name">${product.name}</div>
          <div class="product-weight">${product.weight}</div>
          <div class="product-pricing">
            <span class="product-price">${window.KS.formatPrice(product.price)}</span>
            ${discount > 0 ? `<span class="product-mrp">${window.KS.formatPrice(product.mrp)}</span>` : ''}
            ${discount > 0 ? `<span class="product-discount">${discount}% off</span>` : ''}
          </div>
          <div class="product-buttons">
            <button class="btn btn-primary btn-sm" onclick="Cart.addItem(Products.getById('${product.id}'))">
              🛒 Add to Cart
            </button>
            <button class="btn btn-whatsapp btn-sm" onclick="WhatsApp.orderProduct(Products.getById('${product.id}'))">
              💬 WhatsApp
            </button>
          </div>
        </div>
      </div>
    `;
  },

  // Render product grid
  renderGrid(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (products.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
          <div style="font-size: 3rem; margin-bottom: 16px;">🔍</div>
          <h3 style="margin-bottom: 8px;">No products found</h3>
          <p style="color: var(--color-gray-400);">Try adjusting your filters or search terms</p>
        </div>
      `;
      return;
    }

    container.innerHTML = products.map(p => this.renderCard(p)).join('');
    
    // Re-init scroll animations for new elements
    const reveals = container.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    reveals.forEach(el => observer.observe(el));
  },

  // Get product by ID
  getById(id) {
    return this.allProducts.find(p => p.id === id);
  },

  // Render category cards
  renderCategories(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = this.allCategories.map((cat, i) => `
      <a href="products.html?category=${encodeURIComponent(cat.name)}" class="category-card reveal reveal-delay-${i + 1}">
        <div class="category-icon">${cat.icon}</div>
        <div class="category-name">${cat.name}</div>
        <div class="category-count">${cat.count}+ items</div>
      </a>
    `).join('');

    if (window.KS && typeof window.KS.initScrollAnimations === 'function') {
      window.KS.initScrollAnimations();
    }
  },

  // Init product filters on products page
  initFilters() {
    // Sort dropdown
    const sortEl = document.getElementById('sort-select');
    if (sortEl) {
      sortEl.addEventListener('change', (e) => {
        this.currentFilters.sort = e.target.value;
        this.applyFilters();
        this.renderGrid(this.filteredProducts, 'product-grid');
        this.updateCount();
      });
    }

    // Category checkboxes
    document.querySelectorAll('.filter-category').forEach(cb => {
      cb.addEventListener('change', (e) => {
        this.currentFilters.category = e.target.checked ? e.target.value : '';
        // Uncheck others
        document.querySelectorAll('.filter-category').forEach(other => {
          if (other !== e.target) other.checked = false;
        });
        this.applyFilters();
        this.renderGrid(this.filteredProducts, 'product-grid');
        this.updateCount();
      });
    });

    // Brand checkboxes
    document.querySelectorAll('.filter-brand').forEach(cb => {
      cb.addEventListener('change', (e) => {
        this.currentFilters.brand = e.target.checked ? e.target.value : '';
        document.querySelectorAll('.filter-brand').forEach(other => {
          if (other !== e.target) other.checked = false;
        });
        this.applyFilters();
        this.renderGrid(this.filteredProducts, 'product-grid');
        this.updateCount();
      });
    });

    // Price range
    const priceRange = document.getElementById('price-range');
    if (priceRange) {
      priceRange.addEventListener('input', (e) => {
        this.currentFilters.priceRange[1] = parseInt(e.target.value);
        const label = document.getElementById('price-max-label');
        if (label) label.textContent = window.KS.formatPrice(parseInt(e.target.value));
        this.applyFilters();
        this.renderGrid(this.filteredProducts, 'product-grid');
        this.updateCount();
      });
    }

    // Search on products page
    const searchInput = document.getElementById('products-search');
    if (searchInput) {
      let debounce;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounce);
        debounce = setTimeout(() => {
          this.currentFilters.search = e.target.value;
          this.applyFilters();
          this.renderGrid(this.filteredProducts, 'product-grid');
          this.updateCount();
        }, 300);
      });
    }

    // Check URL params for category
    const urlParams = new URLSearchParams(window.location.search);
    const urlCategory = urlParams.get('category');
    if (urlCategory) {
      this.currentFilters.category = urlCategory;
      const cb = document.querySelector(`.filter-category[value="${urlCategory}"]`);
      if (cb) cb.checked = true;
      this.applyFilters();
    }
  },

  // Update product count display
  updateCount() {
    const countEl = document.getElementById('products-count');
    if (countEl) {
      countEl.innerHTML = `Showing <strong>${this.filteredProducts.length}</strong> of ${this.allProducts.length} products`;
    }
  },

  // Initialize search modal results
  initSearchModal() {
    const input = document.querySelector('.search-modal input');
    const results = document.querySelector('.search-results');
    
    if (!input || !results) return;

    let debounce;
    input.addEventListener('input', (e) => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        const query = e.target.value.trim();
        if (query.length < 2) {
          results.innerHTML = '';
          return;
        }

        const matches = this.search(query).slice(0, 8);
        
        if (matches.length === 0) {
          results.innerHTML = '<p style="text-align:center; padding:20px; color:var(--color-gray-400);">No products found</p>';
          return;
        }

        results.innerHTML = matches.map(p => `
          <a href="products.html?search=${encodeURIComponent(p.name)}" class="search-result-item">
            <img src="${p.image}" alt="${p.name}" onerror="this.style.display='none'">
            <div>
              <div class="result-name">${p.name}</div>
              <div class="result-price">${window.KS.formatPrice(p.price)} <span style="color:var(--color-gray-400);font-size:0.75rem;">${p.weight}</span></div>
            </div>
          </a>
        `).join('');
      }, 200);
    });
  }
};

// Make globally available
window.Products = Products;

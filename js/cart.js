/* ============================================
   KAMALA SUPERMARKET — Shopping Cart
   LocalStorage-based cart system
   ============================================ */

const Cart = {
  STORAGE_KEY: 'kamala_cart',

  // Get all cart items
  getItems() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  },

  // Save items
  saveItems(items) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    this.updateUI();
  },

  // Add item to cart
  addItem(product, qty = 1) {
    const items = this.getItems();
    const existing = items.find(item => item.id === product.id);

    if (existing) {
      existing.qty += qty;
    } else {
      items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        mrp: product.mrp || product.price,
        image: product.image,
        weight: product.weight,
        category: product.category,
        qty: qty
      });
    }

    this.saveItems(items);
    window.KS.showToast(`${product.name} added to cart!`);
  },

  // Remove item
  removeItem(productId) {
    let items = this.getItems();
    items = items.filter(item => item.id !== productId);
    this.saveItems(items);
  },

  // Update quantity
  updateQty(productId, qty) {
    const items = this.getItems();
    const item = items.find(i => i.id === productId);
    
    if (item) {
      if (qty <= 0) {
        this.removeItem(productId);
        return;
      }
      item.qty = qty;
      this.saveItems(items);
    }
  },

  // Get total count
  getCount() {
    return this.getItems().reduce((sum, item) => sum + item.qty, 0);
  },

  // Get total price
  getTotal() {
    return this.getItems().reduce((sum, item) => sum + (item.price * item.qty), 0);
  },

  // Get total savings
  getSavings() {
    return this.getItems().reduce((sum, item) => sum + ((item.mrp - item.price) * item.qty), 0);
  },

  // Clear cart
  clear() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.updateUI();
  },

  // Update all UI elements
  updateUI() {
    // Update cart count badges
    const countEls = document.querySelectorAll('.cart-count');
    const count = this.getCount();
    countEls.forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });

    // Update cart sidebar if open
    this.renderCartSidebar();
  },

  // Toggle cart sidebar
  toggleSidebar() {
    const sidebar = document.querySelector('.cart-sidebar');
    const overlay = document.querySelector('.cart-overlay');
    
    if (!sidebar || !overlay) return;

    const isActive = sidebar.classList.contains('active');
    
    if (isActive) {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    } else {
      sidebar.classList.add('active');
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
      this.renderCartSidebar();
    }
  },

  // Render cart sidebar content
  renderCartSidebar() {
    const body = document.querySelector('.cart-sidebar-body');
    const footer = document.querySelector('.cart-sidebar-footer');
    
    if (!body) return;

    const items = this.getItems();

    if (items.length === 0) {
      body.innerHTML = `
        <div class="cart-empty">
          <div class="empty-icon">🛒</div>
          <h4>Your cart is empty</h4>
          <p>Browse our products and add items to your cart</p>
        </div>
      `;
      if (footer) footer.style.display = 'none';
      return;
    }

    if (footer) footer.style.display = 'block';

    body.innerHTML = items.map(item => `
      <div class="cart-item" data-id="${item.id}">
        <div class="cart-item-image">
          <img src="${item.image}" alt="${item.name}" loading="lazy">
        </div>
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">${window.KS.formatPrice(item.price)}</div>
          <div class="cart-item-qty">
            <button onclick="Cart.updateQty('${item.id}', ${item.qty - 1})">−</button>
            <span>${item.qty}</span>
            <button onclick="Cart.updateQty('${item.id}', ${item.qty + 1})">+</button>
          </div>
        </div>
        <button class="cart-item-remove" onclick="Cart.removeItem('${item.id}')" title="Remove">✕</button>
      </div>
    `).join('');

    // Update footer totals
    const totalEl = document.querySelector('.cart-total-price');
    if (totalEl) totalEl.textContent = window.KS.formatPrice(this.getTotal());

    const savingsEl = document.querySelector('.cart-savings');
    const savings = this.getSavings();
    if (savingsEl) {
      savingsEl.textContent = savings > 0 ? `You save ${window.KS.formatPrice(savings)}` : '';
    }
  },

  // Order via WhatsApp
  orderViaWhatsApp() {
    const items = this.getItems();
    if (items.length === 0) {
      window.KS.showToast('Your cart is empty!', 'error');
      return;
    }
    window.WhatsApp.orderCart(items);
  },

  // Initialize cart
  init() {
    this.updateUI();

    // Cart button click
    const cartBtns = document.querySelectorAll('.nav-cart-btn');
    cartBtns.forEach(btn => {
      btn.addEventListener('click', () => this.toggleSidebar());
    });

    // Cart overlay close
    const overlay = document.querySelector('.cart-overlay');
    if (overlay) {
      overlay.addEventListener('click', () => this.toggleSidebar());
    }

    // Cart close button
    const closeBtn = document.querySelector('.cart-sidebar-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.toggleSidebar());
    }
  }
};

// Initialize cart when DOM ready
document.addEventListener('DOMContentLoaded', () => Cart.init());

// Make globally available
window.Cart = Cart;

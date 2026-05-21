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

  // Order via WhatsApp (triggers Checkout Payment Gateway Modal)
  orderViaWhatsApp() {
    const items = this.getItems();
    if (items.length === 0) {
      window.KS.showToast('Your cart is empty!', 'error');
      return;
    }
    // Close cart sidebar
    this.toggleSidebar();
    // Open Payment Gateway Checkout
    window.Checkout.open(items, this.getTotal());
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

// ============================================
// Checkout & Interactive Payment Gateway Module
// ============================================
const Checkout = {
  items: [],
  cartTotal: 0,
  deliveryFee: 0,
  activeStep: 1,
  selectedPayment: 'cod',
  merchantUpiId: 'kamalasupermarket@okaxis',
  merchantName: 'Kamala Supermarket',

  injectModal() {
    if (document.getElementById('checkout-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'checkout-overlay';
    overlay.className = 'checkout-overlay';

    overlay.innerHTML = `
      <div class="checkout-modal">
        <!-- Processing Overlay -->
        <div class="checkout-processing" id="checkout-processing">
          <div class="checkout-spinner" id="processing-spinner"></div>
          <div class="success-checkmark" id="processing-checkmark" style="display:none;">
            <div class="check-icon">
              <span class="icon-line line-tip"></span>
              <span class="icon-line line-long"></span>
              <div class="icon-circle"></div>
              <div class="icon-fix"></div>
            </div>
          </div>
          <h4 id="processing-title">Processing Order...</h4>
          <p id="processing-message">Please wait while we secure your cart details.</p>
        </div>

        <div class="checkout-header">
          <h3>🛍️ Secure Checkout</h3>
          <button class="checkout-close" onclick="Checkout.close()">✕</button>
        </div>
        
        <div class="checkout-steps">
          <div class="checkout-step-tab active" id="step-tab-1">1. Delivery Info</div>
          <div class="checkout-step-tab" id="step-tab-2">2. Payment Method</div>
        </div>
        
        <div class="checkout-body">
          <!-- STEP 1: Delivery Details -->
          <div class="checkout-step-content active" id="step-content-1">
            <div class="checkout-form-group">
              <label for="co-name">Full Name *</label>
              <input type="text" id="co-name" class="checkout-input" placeholder="Enter your full name" required>
            </div>
            <div class="checkout-form-group">
              <label for="co-phone">Phone Number *</label>
              <input type="tel" id="co-phone" class="checkout-input" placeholder="10-digit mobile number" required>
            </div>
            <div class="checkout-form-group">
              <label for="co-area">Delivery Area *</label>
              <select id="co-area" class="checkout-select" onchange="Checkout.updateArea(this.value)" required>
                <option value="" disabled selected>Select your delivery area</option>
                <option value="town">Villupuram Town (Free, Min ₹200)</option>
                <option value="anna">Anna Nagar / Gandhi Nagar (Free, Min ₹200)</option>
                <option value="kak">Kakuppam / Salamedu (₹30 delivery fee)</option>
                <option value="valu">Valudhareddy / Janakipuram (₹40 delivery fee)</option>
                <option value="other">Other Suburbs (₹50 delivery fee)</option>
              </select>
            </div>
            <div class="checkout-form-group">
              <label for="co-address">Delivery Address *</label>
              <textarea id="co-address" class="checkout-input" rows="3" placeholder="Flat/House No., Street Name, Colony" style="resize:none;" required></textarea>
            </div>
            <div class="checkout-form-group">
              <label for="co-landmark">Landmark (Optional)</label>
              <input type="text" id="co-landmark" class="checkout-input" placeholder="e.g. Near Temple / School">
            </div>
            
            <!-- Real-time Invoice Breakdown Step 1 -->
            <div class="checkout-invoice-summary" id="invoice-summary-step-1"></div>
          </div>
          
          <!-- STEP 2: Payment Gateway Options -->
          <div class="checkout-step-content" id="step-content-2">
            <!-- Real-time Invoice Breakdown Step 2 -->
            <div class="checkout-invoice-summary" id="invoice-summary-step-2" style="margin-bottom: var(--space-4);"></div>

            <div class="payment-tabs">
              <button class="payment-tab-btn active" id="pay-tab-cod" onclick="Checkout.selectPayment('cod')">
                <span class="tab-icon">💵</span>
                <span class="tab-label">Cash / UPI on Del.</span>
              </button>
              <button class="payment-tab-btn" id="pay-tab-upi" onclick="Checkout.selectPayment('upi')">
                <span class="tab-icon">⚡</span>
                <span class="tab-label">Instant UPI</span>
              </button>
              <button class="payment-tab-btn" id="pay-tab-card" onclick="Checkout.selectPayment('card')">
                <span class="tab-icon">💳</span>
                <span class="tab-label">Card / Net Banking</span>
              </button>
              <button class="payment-tab-btn razorpay-tab-btn" id="pay-tab-razorpay" onclick="Checkout.selectPayment('razorpay')">
                <span class="tab-icon">🔶</span>
                <span class="tab-label">All Gateway Options</span>
              </button>
            </div>
            
            <!-- COD PANEL -->
            <div class="payment-details-panel active" id="pay-panel-cod">
              <p style="font-size: var(--text-sm); color: var(--color-gray-600); line-height: 1.5; margin: 0;">
                🔒 <strong>Cash on Delivery (COD) Selected.</strong> You can pay with physical cash or by scanning the delivery agent's UPI QR code when your groceries arrive at your doorstep!
              </p>
            </div>
            
            <!-- UPI INSTANT QR PANEL -->
            <div class="payment-details-panel" id="pay-panel-upi">
              <div class="upi-qr-container">
                <p style="font-size: var(--text-xs); color: var(--color-gray-500); margin-bottom: var(--space-3);">
                  Scan this dynamic QR Code using Google Pay, PhonePe, Paytm, or BHIM to pay instantly.
                </p>
                <div class="upi-qr-image" id="upi-qr-wrapper">
                  <div class="checkout-spinner" style="width:30px; height:30px; border-width:3px;"></div>
                </div>
                <div style="font-weight:700; color:var(--color-primary-dark); font-size:var(--text-sm); margin-top:8px;" id="upi-qr-amount"></div>
                
                <!-- UPI Merchant Copy ID tool -->
                <div class="upi-copy-box" style="margin-top: 12px; display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap; width: 100%;">
                  <span class="upi-id-text" style="font-size: 11px; font-weight: 600; color: var(--color-gray-600); background: var(--color-gray-100); padding: 4px 8px; border-radius: 4px; border: 1px dashed var(--color-gray-300);">${this.merchantUpiId}</span>
                  <button class="btn btn-ghost btn-xs upi-copy-btn" id="upi-copy-button" onclick="Checkout.copyUPI()" style="padding: 4px 8px; font-size: 11px;">📋 Copy ID</button>
                </div>
                
                <!-- Deep link for mobile devices -->
                <a href="" id="upi-deeplink-btn" class="btn btn-primary btn-xs" style="margin-top: 12px; display: none; width: 100%; justify-content: center; align-items: center; gap: 6px; font-weight: 700; text-decoration: none;">
                  ⚡ Pay via UPI Mobile App
                </a>

                <div class="upi-apps">
                  <div class="upi-app-badge">🟢 GPay</div>
                  <div class="upi-app-badge">🟣 PhonePe</div>
                  <div class="upi-app-badge">🔵 Paytm</div>
                </div>
              </div>
            </div>
            
            <!-- CARD / NET BANKING GATEWAY PANEL -->
            <div class="payment-details-panel" id="pay-panel-card">
              <div class="gateway-summary-card">
                <div class="gateway-summary-icon">💳</div>
                <div>
                  <h4>Card / Net Banking Gateway</h4>
                  <p>Choose this if the customer wants to pay by card, net banking, wallet, EMI, or Pay Later. The shop should send or verify the secure Razorpay payment before dispatch.</p>
                </div>
              </div>
              <div class="gateway-safe-note">
                <strong>No card details are collected here.</strong>
                <span>All sensitive payment details must be entered only inside the secure Razorpay/payment gateway page.</span>
              </div>
              
              <div class="rzp-methods-row">
                <span class="rzp-method-badge">💳 Credit Card</span>
                <span class="rzp-method-badge">💳 Debit Card</span>
                <span class="rzp-method-badge">🏦 Net Banking</span>
                <span class="rzp-method-badge">👛 Wallets</span>
                <span class="rzp-method-badge">📆 EMI</span>
                <span class="rzp-method-badge">🧾 Pay Later</span>
              </div>
            </div>

            <!-- RAZORPAY PANEL -->
            <div class="payment-details-panel" id="pay-panel-razorpay">
              <div class="razorpay-info-panel">
                <div class="rzp-logo-row">
                  <span style="font-size:2rem;">🔶</span>
                  <div>
                    <div style="font-weight:700; font-size:var(--text-base); color:var(--color-gray-800);">Pay via Razorpay</div>
                    <div style="font-size:var(--text-xs); color:var(--color-gray-500); margin-top:2px;">India's most trusted payment gateway</div>
                  </div>
                </div>
                <div class="rzp-methods-row">
                  <span class="rzp-method-badge">💳 Cards</span>
                  <span class="rzp-method-badge">⚡ UPI</span>
                  <span class="rzp-method-badge">🏦 Net Banking</span>
                  <span class="rzp-method-badge">👛 Wallets</span>
                  <span class="rzp-method-badge">📆 EMI</span>
                  <span class="rzp-method-badge">🧾 Pay Later</span>
                  <span class="rzp-method-badge">🏷️ Offers</span>
                </div>
                <p class="rzp-desc">
                  🔒 Choose this option for A to Z payment gateway methods. Your order alert will be sent to ${window.KS.CONFIG.phone}; collect payment through your connected Razorpay account before dispatch.
                </p>
                <div class="rzp-trust-row">
                  <span>✅ PCI-DSS Compliant</span>
                  <span>✅ 256-bit SSL</span>
                  <span>✅ Instant Confirmation</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="checkout-footer">
          <div class="checkout-totals-summary">
            <span class="summary-label">Amount Payable</span>
            <span class="summary-val" id="checkout-payable-total">₹0</span>
          </div>
          <div class="checkout-actions-row">
            <button class="btn btn-ghost btn-sm" id="checkout-back-btn" onclick="Checkout.back()" style="display:none;">Back</button>
            <button class="btn btn-primary btn-md" id="checkout-next-btn" onclick="Checkout.next()">Next: Payment</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Add escape key closing
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) Checkout.close();
    });
  },

  open(items, total) {
    this.items = items;
    this.cartTotal = total;
    this.deliveryFee = 0;
    this.activeStep = 1;
    this.selectedPayment = 'cod';

    this.injectModal();

    // Attempt to load previously saved profile details
    const profileStr = localStorage.getItem('kamala_checkout_profile');
    if (profileStr) {
      try {
        const profile = JSON.parse(profileStr);
        document.getElementById('co-name').value = profile.name || '';
        document.getElementById('co-phone').value = profile.phone || '';
        document.getElementById('co-area').value = profile.area || '';
        document.getElementById('co-address').value = profile.address || '';
        document.getElementById('co-landmark').value = profile.landmark || '';

        if (profile.area) {
          this.updateArea(profile.area);
        } else {
          this.updatePayableTotal();
          this.renderInvoiceSummary();
        }
      } catch (e) {
        console.error('Error loading checkout profile', e);
        this.resetInputs();
      }
    } else {
      this.resetInputs();
    }

    // Activate overlay
    document.getElementById('checkout-overlay').classList.add('active');
    document.body.style.overflow = 'hidden';

    // Reset steps
    this.showStep(1);
  },

  resetInputs() {
    document.getElementById('co-name').value = '';
    document.getElementById('co-phone').value = '';
    document.getElementById('co-area').value = '';
    document.getElementById('co-address').value = '';
    document.getElementById('co-landmark').value = '';
    this.deliveryFee = 0;
    this.updatePayableTotal();
    this.renderInvoiceSummary();
  },

  close() {
    const overlay = document.getElementById('checkout-overlay');
    if (overlay) {
      overlay.classList.remove('active');
    }
    document.body.style.overflow = '';
  },

  updateArea(value) {
    if (value === 'town' || value === 'anna') {
      this.deliveryFee = 0;
    } else if (value === 'kak') {
      this.deliveryFee = 30;
    } else if (value === 'valu') {
      this.deliveryFee = 40;
    } else if (value === 'other') {
      this.deliveryFee = 50;
    }
    this.updatePayableTotal();
    this.renderInvoiceSummary();
  },

  updatePayableTotal() {
    const payable = this.cartTotal + this.deliveryFee;
    document.getElementById('checkout-payable-total').textContent = window.KS.formatPrice(payable);
  },

  renderInvoiceSummary() {
    const subtotal = this.cartTotal;
    const delivery = this.deliveryFee;
    const total = subtotal + delivery;

    const deliveryText = delivery === 0 ? 'FREE' : `₹${delivery}`;
    const isMinOrderValid = subtotal >= window.KS.CONFIG.minOrder;

    const html = `
      <div class="invoice-summary-card">
        <div class="invoice-title">📋 Order Summary</div>
        <div class="invoice-row">
          <span class="invoice-label">Items Subtotal:</span>
          <span class="invoice-value">${window.KS.formatPrice(subtotal)}</span>
        </div>
        <div class="invoice-row">
          <span class="invoice-label">Delivery Fee:</span>
          <span class="invoice-value ${delivery === 0 ? 'delivery-free-highlight' : ''}">${deliveryText}</span>
        </div>
        <hr class="invoice-divider">
        <div class="invoice-row invoice-grand-total">
          <span class="invoice-label">Total Payable:</span>
          <span class="invoice-value">${window.KS.formatPrice(total)}</span>
        </div>
        ${!isMinOrderValid ? `
          <div class="invoice-warning">
            ⚠️ Minimum order for delivery is ${window.KS.formatPrice(window.KS.CONFIG.minOrder)}. Your cart is short by ${window.KS.formatPrice(window.KS.CONFIG.minOrder - subtotal)}.
          </div>
        ` : ''}
      </div>
    `;

    const box1 = document.getElementById('invoice-summary-step-1');
    const box2 = document.getElementById('invoice-summary-step-2');
    if (box1) box1.innerHTML = html;
    if (box2) box2.innerHTML = html;
  },

  copyUPI() {
    const upiId = this.merchantUpiId;
    const successHandler = () => {
      const btn = document.getElementById('upi-copy-button');
      if (btn) {
        btn.innerHTML = '✓ Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.innerHTML = '📋 Copy ID';
          btn.classList.remove('copied');
        }, 2000);
      }
      window.KS.showToast('Merchant UPI ID copied to clipboard!', 'success');
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(upiId).then(successHandler).catch(() => {
        this.copyUPIFallback(upiId, successHandler);
      });
    } else {
      this.copyUPIFallback(upiId, successHandler);
    }
  },

  copyUPIFallback(text, successHandler) {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.position = 'fixed';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) {
        successHandler();
      } else {
        window.KS.showToast('Failed to copy UPI ID. Please write it manually!', 'error');
      }
    } catch (err) {
      window.KS.showToast('Failed to copy UPI ID. Please write it manually!', 'error');
    }
  },

  showStep(step) {
    this.activeStep = step;

    // Tabs
    document.getElementById('step-tab-1').classList.toggle('active', step === 1);
    document.getElementById('step-tab-2').classList.toggle('active', step === 2);

    // Contents
    document.getElementById('step-content-1').classList.toggle('active', step === 1);
    document.getElementById('step-content-2').classList.toggle('active', step === 2);

    // Actions
    const backBtn = document.getElementById('checkout-back-btn');
    const nextBtn = document.getElementById('checkout-next-btn');

    if (step === 1) {
      backBtn.style.display = 'none';
      nextBtn.textContent = 'Next: Payment';
    } else {
      backBtn.style.display = 'block';
      nextBtn.textContent = 'Send Order Alert';
      if (this.selectedPayment === 'upi') {
        this.generateUPIQR();
      }
    }
  },

  back() {
    if (this.activeStep === 2) {
      this.showStep(1);
    }
  },

  next() {
    if (this.activeStep === 1) {
      // Validate step 1 fields
      const name = document.getElementById('co-name').value.trim();
      const phone = document.getElementById('co-phone').value.trim();
      const area = document.getElementById('co-area').value;
      const address = document.getElementById('co-address').value.trim();

      if (!name || !phone || !area || !address) {
        window.KS.showToast('Please fill out all required fields!', 'error');
        return;
      }

      if (phone.length < 10) {
        window.KS.showToast('Please enter a valid 10-digit mobile number!', 'error');
        return;
      }

      // Check business rule: min order threshold check
      if (this.cartTotal < window.KS.CONFIG.minOrder) {
        window.KS.showToast(`Minimum order amount for delivery is ${window.KS.formatPrice(window.KS.CONFIG.minOrder)}!`, 'error');
        return;
      }

      this.showStep(2);
    } else {
      // Step 2 Checkout Placing
      this.processPaymentAndSubmit();
    }
  },

  selectPayment(method) {
    this.selectedPayment = method;

    // Tabs
    document.getElementById('pay-tab-cod').classList.toggle('active', method === 'cod');
    document.getElementById('pay-tab-upi').classList.toggle('active', method === 'upi');
    document.getElementById('pay-tab-card').classList.toggle('active', method === 'card');
    document.getElementById('pay-tab-razorpay').classList.toggle('active', method === 'razorpay');

    // Panels
    document.getElementById('pay-panel-cod').classList.toggle('active', method === 'cod');
    document.getElementById('pay-panel-upi').classList.toggle('active', method === 'upi');
    document.getElementById('pay-panel-card').classList.toggle('active', method === 'card');
    document.getElementById('pay-panel-razorpay').classList.toggle('active', method === 'razorpay');

    // Actions button rename
    const nextBtn = document.getElementById('checkout-next-btn');
    nextBtn.textContent = 'Send Order Alert';

    if (method === 'upi') {
      this.generateUPIQR();
    }
  },

  generateUPIQR() {
    const wrapper = document.getElementById('upi-qr-wrapper');
    const amountVal = document.getElementById('upi-qr-amount');
    if (!wrapper || !amountVal) return;

    const payable = this.cartTotal + this.deliveryFee;
    amountVal.textContent = window.KS.formatPrice(payable);

    // Generate UPI URL
    const upiUrl = `upi://pay?pa=${this.merchantUpiId}&pn=${encodeURIComponent(this.merchantName)}&am=${payable}&cu=INR&tn=KamalaOrder`;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=8&data=${encodeURIComponent(upiUrl)}`;

    wrapper.innerHTML = `<img src="${qrApiUrl}" alt="UPI Payment QR Code" onload="this.parentElement.style.border = '2px solid var(--color-success)'">`;

    // Detect mobile viewport to show pay deep link directly
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
    const deepBtn = document.getElementById('upi-deeplink-btn');
    if (deepBtn) {
      deepBtn.href = upiUrl;
      deepBtn.style.display = isMobile ? 'flex' : 'none';
    }
  },

  syncCardField(field, val) {
    if (field === 'holder') {
      document.getElementById('vis-card-holder').textContent = val.toUpperCase() || 'YOUR NAME';
    } else if (field === 'number') {
      // Robust space formatting (preserves backspace seamlessly)
      let digits = val.replace(/\D/g, '').substring(0, 16);
      let formatted = '';
      for (let i = 0; i < digits.length; i++) {
        if (i > 0 && i % 4 === 0) {
          formatted += ' ';
        }
        formatted += digits[i];
      }
      document.getElementById('card-number-input').value = formatted;
      document.getElementById('vis-card-num').textContent = formatted || '•••• •••• •••• ••••';

      // Sync Card Brand visual representations
      const brandEl = document.getElementById('vis-card-brand');
      const inputBrandEl = document.getElementById('input-card-brand');
      let brandName = 'RUPAY';
      let brandColor = '#fff';

      if (digits.startsWith('4')) {
        brandName = 'VISA';
        brandColor = '#3b82f6';
      } else if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) {
        brandName = 'MASTERCARD';
        brandColor = '#ef4444';
      } else if (/^60|^6521/.test(digits)) {
        brandName = 'RUPAY';
        brandColor = '#10b981';
      } else if (/^3[47]/.test(digits)) {
        brandName = 'AMEX';
        brandColor = '#f59e0b';
      }

      brandEl.textContent = brandName;
      brandEl.style.color = brandColor;
      if (inputBrandEl) {
        inputBrandEl.textContent = brandName;
        inputBrandEl.className = `input-card-brand brand-${brandName.toLowerCase()}`;
      }
    } else if (field === 'expiry') {
      // Expiry MM/YY auto-slash formatter
      let clean = val.replace(/\D/g, '').substring(0, 4);
      let formatted = clean;
      if (clean.length > 2) {
        formatted = clean.substring(0, 2) + '/' + clean.substring(2);
      }
      document.getElementById('card-expiry-input').value = formatted;
      document.getElementById('vis-card-expiry').textContent = formatted || 'MM/YY';
    } else if (field === 'cvv') {
      let clean = val.replace(/\D/g, '').substring(0, 4);
      document.getElementById('card-cvv-input').value = clean;
      document.getElementById('vis-card-cvv').textContent = clean || '•••';
    }
  },

  flipCard(isFlipped) {
    document.getElementById('credit-card-box').classList.toggle('flipped', isFlipped);
  },

  saveOrderStatus(order) {
    try {
      const orders = JSON.parse(localStorage.getItem('kamala_order_history')) || [];
      const orderRecord = {
        ...order,
        status: 'Order sent to shop',
        statusSteps: [
          { label: 'Order sent to shop', done: true },
          { label: 'Shop confirmation pending', done: false },
          { label: 'Payment verification pending', done: false },
          { label: 'Delivery dispatch pending', done: false }
        ],
        updatedAt: new Date().toISOString()
      };
      const nextOrders = [orderRecord, ...orders.filter(item => item.id !== order.id)].slice(0, 10);
      localStorage.setItem('kamala_last_order', JSON.stringify(orderRecord));
      localStorage.setItem('kamala_order_history', JSON.stringify(nextOrders));
    } catch (error) {
      console.error('Unable to save order status', error);
    }
  },

  processPaymentAndSubmit() {
    const processing = document.getElementById('checkout-processing');
    const spinner = document.getElementById('processing-spinner');
    const checkmark = document.getElementById('processing-checkmark');
    const title = document.getElementById('processing-title');
    const desc = document.getElementById('processing-message');

    processing.classList.add('active');

    if (this.selectedPayment === 'cod') {
      title.textContent = 'Placing Order...';
      desc.textContent = 'Compiling receipt and connecting to WhatsApp.';
    } else {
      title.textContent = 'Preparing Payment Request...';
      desc.textContent = 'Compiling order and selected payment method.';
    }

    // Simulate transaction progress
    setTimeout(() => {
      if (this.selectedPayment !== 'cod') {
        title.textContent = 'Preparing Shop Notification...';
        desc.textContent = 'Adding payment instructions to the WhatsApp alert.';
      }

      setTimeout(() => {
        // Show success animation
        spinner.style.display = 'none';
        checkmark.style.display = 'block';
        title.textContent = 'Order Alert Ready!';
        desc.textContent = `Opening WhatsApp so the order reaches ${window.KS.CONFIG.phone}.`;

        setTimeout(() => {
          this.submitReceiptAndWhatsApp();
        }, 1500);
      }, 1500);
    }, 1500);
  },

  submitReceiptAndWhatsApp() {
    const name = document.getElementById('co-name').value.trim();
    const phone = document.getElementById('co-phone').value.trim();
    const areaSelect = document.getElementById('co-area');
    const areaVal = areaSelect.value;
    const areaText = areaSelect.options[areaSelect.selectedIndex].text;
    const address = document.getElementById('co-address').value.trim();
    const landmark = document.getElementById('co-landmark').value.trim() || 'None';

    // Save details to LocalStorage Shipping Profile for autocomplete convenience
    const profile = {
      name,
      phone,
      area: areaVal,
      address,
      landmark
    };
    localStorage.setItem('kamala_checkout_profile', JSON.stringify(profile));

    const randomOrderId = 'KS' + Math.floor(100000 + Math.random() * 900000);

    let itemsList = this.items.map((item, i) =>
      `${i + 1}. ${item.name} (${item.weight || 'Std'}) x${item.qty} = ${window.KS.formatPrice(item.price * item.qty)}`
    ).join('\n');

    const subtotal = this.cartTotal;
    const total = subtotal + this.deliveryFee;

    let methodLabel = '';
    let statusLabel = '';
    let paymentInstruction = '';
    if (this.selectedPayment === 'cod') {
      methodLabel = 'Cash on Delivery (COD)';
      statusLabel = 'Payment pending - collect on delivery';
      paymentInstruction = 'Collect cash or delivery-agent UPI payment before handover.';
    } else if (this.selectedPayment === 'upi') {
      methodLabel = `Instant UPI to ${this.merchantUpiId}`;
      statusLabel = 'Awaiting shop verification';
      paymentInstruction = 'Please verify the UPI credit in the merchant bank/UPI app before dispatch.';
    } else if (this.selectedPayment === 'card') {
      methodLabel = 'Card / Net Banking / Wallet via Gateway';
      statusLabel = 'Gateway payment request needed';
      paymentInstruction = 'Send a Razorpay/payment-gateway link or confirm gateway payment before dispatch.';
    } else if (this.selectedPayment === 'razorpay') {
      methodLabel = 'Razorpay - all gateway options';
      statusLabel = 'Gateway payment request needed';
      paymentInstruction = 'Use Razorpay for cards, UPI, net banking, wallets, EMI, Pay Later, and offers.';
    } else {
      methodLabel = 'Payment Gateway';
      statusLabel = 'Awaiting confirmation';
      paymentInstruction = 'Confirm payment before dispatch.';
    }

    const message = `New order notification for ${window.KS.CONFIG.storeName}! 🛒
Please confirm this order on ${window.KS.CONFIG.phone}.

━━━━━━━━━━━━━━━━━━
🆔 Order ID: *${randomOrderId}*
👤 Customer Name: *${name}*
📱 Phone Number: *${phone}*
━━━━━━━━━━━━━━━━━━

📦 *Ordered Items:*
${itemsList}

━━━━━━━━━━━━━━━━━━
💵 Subtotal: ${window.KS.formatPrice(subtotal)}
🚚 Delivery Charge: ${window.KS.formatPrice(this.deliveryFee)}
💰 *Grand Total: ${window.KS.formatPrice(total)}*
━━━━━━━━━━━━━━━━━━

💳 *Payment Information:*
🏷️ Payment Method: *${methodLabel}*
📌 Status: *${statusLabel}*
✅ Shop Action: ${paymentInstruction}

📍 *Delivery Address:*
🏠 Address: ${address}
🏙️ Area: ${areaText}
🗺️ Landmark: ${landmark}

Please confirm item availability, payment status, and delivery dispatch time.`;

    this.saveOrderStatus({
      id: randomOrderId,
      customerName: name,
      customerPhone: phone,
      area: areaText,
      address,
      landmark,
      items: this.items,
      subtotal,
      deliveryFee: this.deliveryFee,
      total,
      paymentMethod: methodLabel,
      paymentStatus: statusLabel
    });

    const link = window.KS.generateWhatsAppLink(message);
    window.open(link, '_blank');

    // Clear cart and close modal
    Cart.clear();
    this.close();

    // Hide loading
    document.getElementById('checkout-processing').classList.remove('active');
    document.getElementById('processing-spinner').style.display = 'block';
    document.getElementById('processing-checkmark').style.display = 'none';
  }
};

window.Checkout = Checkout;

// Initialize cart when DOM ready
document.addEventListener('DOMContentLoaded', () => Cart.init());

// Make globally available
window.Cart = Cart;

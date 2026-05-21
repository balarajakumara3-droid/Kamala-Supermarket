/* ============================================
   KAMALA SUPERMARKET — Local Order Status
   Shows the latest WhatsApp checkout order saved on this device.
   ============================================ */

const OrderStatus = {
  getOrders() {
    try {
      return JSON.parse(localStorage.getItem('kamala_order_history')) || [];
    } catch {
      return [];
    }
  },

  findOrder(orderId = '') {
    const normalized = orderId.trim().toUpperCase();
    const orders = this.getOrders();
    if (!normalized) {
      return orders[0] || null;
    }
    return orders.find(order => order.id.toUpperCase() === normalized) || null;
  },

  render(orderId = '') {
    const container = document.getElementById('order-status-result');
    if (!container) return;

    const order = this.findOrder(orderId);
    if (!order) {
      container.innerHTML = `
        <div class="status-empty">
          <strong>No local order found.</strong>
          <span>Place an order from the cart, then your latest order status will appear here.</span>
        </div>
      `;
      return;
    }

    const itemCount = (order.items || []).reduce((sum, item) => sum + item.qty, 0);
    const steps = order.statusSteps || [];
    container.innerHTML = `
      <div class="status-card">
        <div class="status-card-head">
          <div>
            <span class="status-eyebrow">Latest order</span>
            <h4>${order.id}</h4>
          </div>
          <span class="status-pill">${order.status}</span>
        </div>
        <div class="status-grid">
          <span><strong>${itemCount}</strong> items</span>
          <span><strong>${window.KS.formatPrice(order.total || 0)}</strong> total</span>
          <span><strong>${order.paymentStatus}</strong></span>
        </div>
        <div class="status-steps">
          ${steps.map(step => `
            <div class="status-step ${step.done ? 'done' : ''}">
              <span class="status-dot"></span>
              <span>${step.label}</span>
            </div>
          `).join('')}
        </div>
        <p class="status-note">For live updates, please send this order ID on WhatsApp. Backend tracking can update these steps automatically once connected.</p>
      </div>
    `;
  },

  init() {
    const form = document.getElementById('order-status-form');
    const input = document.getElementById('order-status-input');
    if (form) {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        this.render(input ? input.value : '');
      });
    }
    this.render();
  }
};

document.addEventListener('DOMContentLoaded', () => OrderStatus.init());
window.OrderStatus = OrderStatus;

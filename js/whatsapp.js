/* ============================================
   KAMALA SUPERMARKET — WhatsApp Ordering
   ============================================ */

const WhatsApp = {
  // Generate WhatsApp link for a single product
  orderProduct(product, qty = 1) {
    const message = `Hi ${window.KS.CONFIG.storeName}! 🛒

I want to order:
📦 Product: ${product.name}
⚖️ Weight/Size: ${product.weight || 'Standard'}
🔢 Quantity: ${qty}
💰 Price: ${window.KS.formatPrice(product.price)} ${qty > 1 ? `x ${qty} = ${window.KS.formatPrice(product.price * qty)}` : ''}

Please confirm availability and delivery time.
Thank you! 🙏`;

    const link = window.KS.generateWhatsAppLink(message);
    window.open(link, '_blank');
  },

  // Generate WhatsApp link for full cart
  orderCart(cartItems) {
    if (!cartItems || cartItems.length === 0) {
      window.KS.showToast('Your cart is empty!', 'error');
      return;
    }

    let itemsList = cartItems.map((item, i) => 
      `${i + 1}. ${item.name} (${item.weight || 'Std'}) x${item.qty} = ${window.KS.formatPrice(item.price * item.qty)}`
    ).join('\n');

    const total = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);

    const message = `Hi ${window.KS.CONFIG.storeName}! 🛒

I want to order the following items:

${itemsList}

━━━━━━━━━━━━━━━
💰 Total: ${window.KS.formatPrice(total)}
━━━━━━━━━━━━━━━

📍 Delivery Address: [Please fill]
📱 Contact Number: [Please fill]

Please confirm availability and delivery time.
Thank you! 🙏`;

    const link = window.KS.generateWhatsAppLink(message);
    window.open(link, '_blank');
  },

  // General enquiry
  enquiry(subject = '') {
    const message = subject 
      ? `Hi ${window.KS.CONFIG.storeName}! I have a query about: ${subject}`
      : `Hi ${window.KS.CONFIG.storeName}! I'd like to know more about your products and services.`;

    const link = window.KS.generateWhatsAppLink(message);
    window.open(link, '_blank');
  },

  // Bulk order enquiry
  bulkOrder() {
    const message = `Hi ${window.KS.CONFIG.storeName}! 

I'm interested in placing a bulk order for my business/event.

Business/Event: [Please specify]
Items needed: [Please list items]
Quantity: [Approximate quantity]
Delivery Date: [Required date]

Please share your bulk pricing.
Thank you!`;

    const link = window.KS.generateWhatsAppLink(message);
    window.open(link, '_blank');
  },

  // Monthly bundle subscription
  subscribeBundle(bundleName, price) {
    const message = `Hi ${window.KS.CONFIG.storeName}! 📦

I'd like to subscribe to the ${bundleName} Monthly Bundle (${window.KS.formatPrice(price)}/month).

Please share the details and help me get started.
Thank you!`;

    const link = window.KS.generateWhatsAppLink(message);
    window.open(link, '_blank');
  }
};

// Make globally available
window.WhatsApp = WhatsApp;

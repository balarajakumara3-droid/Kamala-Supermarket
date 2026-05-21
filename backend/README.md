# Backend Integration Plan

This website is currently a static storefront. Real Razorpay payment capture, WhatsApp Business notifications, SMS alerts, and live order tracking must run from a backend so private API keys never reach the browser.

## Recommended Production Flow

1. Frontend sends cart, customer, address, and payment method to `POST /api/orders`.
2. Backend creates a real order record in a database.
3. If online payment is selected, backend creates a Razorpay order and returns the checkout details.
4. Razorpay webhook calls `POST /api/webhooks/razorpay` after payment success or failure.
5. Backend sends shop alerts through WhatsApp Business API and SMS provider.
6. Frontend checks `GET /api/orders/:orderId` for live order status.

## Environment Variables Needed

```bash
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
WHATSAPP_BUSINESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
SHOP_ALERT_PHONE=918438659762
SMS_PROVIDER_API_KEY=
DATABASE_URL=
```

## Suggested Statuses

- `created`
- `shop_notified`
- `payment_pending`
- `payment_verified`
- `packing`
- `out_for_delivery`
- `delivered`
- `cancelled`

## Notes

- Do not put Razorpay secret keys, WhatsApp tokens, or SMS keys in frontend JavaScript.
- Keep the current WhatsApp handoff as a fallback if the backend is offline.
- Add an admin screen later so shop staff can update packing and delivery status.

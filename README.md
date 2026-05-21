# Kamala-Supermarket

Static storefront for Kamala Supermarket with product browsing, cart checkout, WhatsApp ordering, payment-method selection, and local order-status lookup.

## Recent Improvements

- Shorter splash screen so shoppers reach products faster.
- Optimized remote product images with responsive `srcset`, lower image quality, lazy loading, and async decoding.
- Local order tracking for the latest WhatsApp checkout order saved on the customer's device.
- Safer payment gateway messaging: card and Razorpay methods are treated as gateway requests that the shop verifies before dispatch.
- Backend integration notes for real Razorpay capture, WhatsApp Business alerts, SMS notifications, and live order tracking.

## Backend Next Step

See `backend/README.md` for the recommended secure backend flow. Real Razorpay capture and WhatsApp/SMS alerts need server-side API keys and webhooks, so they should not be implemented only in browser JavaScript.

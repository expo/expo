---
title: Payments
---

Expo currently supports payments through [Stripe](https://stripe.com/) via [stripe-client](https://github.com/expo/stripe-expo) and a custom card form.

- Note: Expo previously included support for a native Payments API. However, the Payments API was using the Stripe SDK on iOS. We learned that Apple sometimes asks developers to include the Stripe SDK only if their apps let users pay for goods. To help your App Review process go more smoothly, we've decided to remove the Stripe SDK and experimental Payments API from apps built with the Expo standalone builder. We're still excited to give developers a way to let users pay for goods when they need to and we'll announce ways to do so shortly.

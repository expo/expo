---
title: Using VAPID for Web Push Notifications
---

Voluntary Application Server Identification (VAPID) for Web Push keys (also called application server keys) are required for enabling push notifications in Expo for Web projects. To set up your Expo for Web project to get push notifications, follow this guide closely.

Learn more about VAPID keys and web push notifications [here](https://developers.google.com/web/updates/2016/07/web-push-interop-wins) and [here](https://developers.google.com/web/fundamentals/push-notifications/).

Note that you do not necessarily need to send web push notifications through Expo's server. If you do not wish to store your VAPID keys on Expo's server, you can instead use [`Notifications.getDevicePushTokenAsync()`](../../sdk/notifications/#notificationsgetdevicepushtokenasyncconfig) to obtain the client's token, and send the notifications yourself from your server with tools such as [web-push](https://github.com/web-push-libs/web-push). In that case, you can disregard the information about "Uploading Credentials" below and jump directly to "[Client Setup](#client-setup)".

## Uploading Credentials

To send push notifications to web projects through Expo's server, three items are needed to be stored on Expo's server.

- A VAPID public key.
- A VAPID private key.
- A VAPID subject, which needs to be a URL or a `mailto:` URL. This provides a point of contact in case in exceptional situations where the push service needs to contact the message sender (as defined [here](https://tools.ietf.org/html/draft-ietf-webpush-vapid-00#section-2.1)).

Note that the VAPID subject can be overridden in the individual push notification by providing a `vapidSubject` value in the message. Learn more [here](../../guides/push-notifications/#message-format).

### Option 1: Generating VAPID keys

Expo's server can help you generate the VAPID public/private key pair. Simply type the following command in your project directory. The generated key will be automatically stored on Expo's server.

```bash
expo push:web:generate --vapid-subject <vapid-subject>
```

### Option 2: Uploading your own VAPID keys

You can also choose to upload your own VAPID key pair to Expo's server by using the following command:

Note that both keys should be URL-safe and base64-encoded.

```bash
expo push:web:upload --vapid-pubkey <vapid-public-key> --vapid-pvtkey <vapid-private-key> --vapid-subject <vapid-subject>
```

## Client Setup

**Note:** If you use `expo push:web:generate` or `expo push:web:upload` command above to generate/upload your VAPID keys, the following steps should have done for you automatically by Expo CLI.

You will also need to add your VAPID public key to your client app's `app.json` file in the `notification.vapidPublicKey` field.

You should also include your username (the username of the Expo account which uploaded the keys) in the `owner` field. You do not have to do this if you choose to not handle web push notifications through Expo's server.

Note that you can always find your uploaded VAPID keys by using the command `expo push:web:show`.

```javascript
{
  ...
  "owner": "your_expo_username",
  ...
  "notification": {
    "vapidPublicKey": "...",
    ...
  }
}
```

That's it -- users who visit the site will now receive notifications using your project's credentials. You just send the push notifications as you normally would (see [guide](../../guides/push-notifications#2-call-expos-push-api-with-the)).

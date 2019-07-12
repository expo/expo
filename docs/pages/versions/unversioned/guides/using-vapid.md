---
title: Using VAPID for Web Push Notifications
---

TODO

## What is VAPID?

```javascript
webpush.setVapidDetails(
  'mailto:example@yourdomain.org',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);
```

Details: https://developers.google.com/web/updates/2016/07/web-push-interop-wins

## Client Setup

```javascript
{
  ...
  "web": {
    "pushPublicKey": "...",
    ...
  }
}
```

Also you must include "owner" (your Expo username) in `app.json`.

## Uploading Server Credentials

```bash
expo push:web:upload --vapid-pubkey <vapid-public-key> --vapid-pvtkey <vapid-private-key> --vapid-subject <vapid-subject>
```

```bash
expo push:web:generate --vapid-subject <vapid-subject>
```
Output public key and private key. Also prompt user to enter public key to app.json

```bash
expo push:web:show
```
Print the VAPID public key, the VAPID private key, and the VAPID subject currently in use for web notifications for this project.

```bash
expo push:web:clear
```
Clear public key, private key, and vapid subject stored on Expo server.



TODO: vapid-subject can be overridden in individual push message

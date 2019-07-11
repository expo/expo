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

## Uploading Server Credentials

```bash
expo push:web:upload --vapid-subject=<vapid subject> --vapid-pubkey=<public key url base64> --vapid-pvtkey=<private key url base64>
```

```bash
expo push:web:generate --vapid-subject=<vapid subject>
```
Output public key and private key. Also prompt user to enter public key to app.json

```bash
expo push:web:update [--vapid-subject=<vapid subject>] [--vapid-pubkey=<public key url base64>] [--vapid-pvtkey=<private key url base64>]
```
Update info. Also prompt user to update public key in app.json if necessary


```bash
expo push:web:info
```
Output public key, private key, and vapid subject



TODO: vapid-subject can be override in individual push message

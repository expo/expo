---
title: Build Webhooks
---

Expo can alert you as soon as your build has finished via a webhook. Webhooks need to be configured per-project, so if you want to be alerted about builds for both `@yourUsername/awesomeApp` and `@yourUsername/coolApp`, you need to run `expo webhooks:add --event build --url <webhook-url>` in each directory.

After running that command, you'll be given a webhook signing secret, if you have not already provided your own with the `--secret` command line option. It must be at least 16 characters long, and it will be used to calculate the signature of the request body which we send as the value of the `expo-signature` HTTP header. You can use the signature to verify a webhook request is genuine (example code below). We promise that we keep your secret securely encrypted in our database.

We call your webhook using an HTTP POST request and we pass data in the request body. Expo sends your webhook as a JSON object with following fields:

- `status` - a string specifying whether your build has finished successfully (can be either `finished` or `errored`)
- `id` - the unique ID of your build
- `artifactUrl` - the URL to the build artifact (only included if `status === 'finished'`)
- `platform` - 'ios' | 'android'

Additionally, we send an `expo-signature` HTTP header with the hash signature of the payload. You can use this signature to verify the request is from Expo. The signature is a hex-encoded HMAC-SHA1 digest of the request body, using your webhook secret as the HMAC key.

Here's an example of how you can implement your server:

```javascript
import crypto from 'crypto';
import express from 'express';
import bodyParser from 'body-parser';
import safeCompare from 'safe-compare';

const app = express();
app.use(bodyParser.text({ type: '*/*' }));
app.post('/webhook', (req, res) => {
  const expoSignature = req.headers['expo-signature'];
  // process.env.SECRET_WEBHOOK_KEY has to match <webhook-secret> value set with `expo webhooks:add ...` command
  const hmac = crypto.createHmac('sha1', process.env.SECRET_WEBHOOK_KEY);
  hmac.update(req.body);
  const hash = `sha1=${hmac.digest('hex')}`;
  if (!safeCompare(expoSignature, hash)) {
    res.status(500).send("Signatures didn't match!");
  } else {
    // do something here, like send a notification to Slack!
    res.send('OK!');
  }
});
app.listen(8080, () => console.log('Listening on port 8080'));
```

> If you want to test the above webhook locally, you have to use a service like [ngrok](https://ngrok.com/docs) to forward `localhost:8080` via a tunnel and make it publicly accessible to anyone with the URL `ngrok` gives you.

You can always change your webhook URL and/or webhook secret using the same command you used to set up the webhook for the first time. To see what your webhook is currently set to, you can use `expo webhooks:show`. If you would like us to stop sending requests to your webhook, simply run `expo webhooks:clear` from your project directory.

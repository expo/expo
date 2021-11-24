---
title: Webhooks
---

import { InlineCode } from '~/components/base/code';

EAS can alert you as soon as your build or submission has completed via a webhook. Webhooks need to be configured per-project, so if you want to be alerted for both `@johndoe/awesomeApp` and `@johndoe/coolApp`, you need to run `eas webhook:create` in each directory.

<details><summary><strong>Are you using the classic build system?</strong> (<InlineCode>expo build:[android|ios]</InlineCode>)</summary> <p>

Webhooks function almost exactly the same for both EAS Build and the classic `expo build` system, _except_ that for `expo build` webhooks, you'll use `expo-cli` to interact with them, and **not** `eas-cli`. For `expo build` webhooks, you'll use:

- `expo webhooks [path]`: List all webhooks for a project
- `expo webhooks:add [path]`: Add a webhook to a project
- `expo webhooks:remove [path]`: Delete a webhook
- `expo webhooks:update [path]`: Update an existing webhook

</p>
</details>

After running `eas webhook:create`, you'll be prompted to choose the webhook event type (unless you provide the `--event BUILD|SUBMIT` parameter). Next, provide the webhook URL (or specify it with the `--url` flag) that handles HTTP POST requests. Additionally, you'll have to input a webhook signing secret, if you have not already provided it with the `--secret` flag. It must be at least 16 characters long, and it will be used to calculate the signature of the request body which we send as the value of the `expo-signature` HTTP header. You can use the signature to verify a webhook request is genuine (example code below).

EAS calls your webhook using an HTTP POST request. All the data is passed in the request body. EAS sends the data as a JSON object. The most notable fields are:

Additionally, we send an `expo-signature` HTTP header with the hash signature of the payload. You can use this signature to verify the authenticity of the request. The signature is a hex-encoded HMAC-SHA1 digest of the request body, using your webhook secret as the HMAC key.

> If you want to test the above webhook locally, you have to use a service like [ngrok](https://ngrok.com/docs) to forward `localhost:8080` via a tunnel and make it publicly accessible with the URL `ngrok` gives you.

You can always change your webhook URL and/or webhook secret using `eas webhook:update --id WEBHOOK_ID`. You can find the webhook ID by running `eas webhook:list`. If you would like us to stop sending requests to your webhook, run `eas webhook:delete` and choose the webhook from the list.

## Webhook server

Here's an example of how you can implement your server:

```javascript
const crypto = require('crypto');
const express = require('express');
const bodyParser = require('body-parser');
const safeCompare = require('safe-compare');

const app = express();
app.use(bodyParser.text({ type: '*/*' }));
app.post('/webhook', (req, res) => {
  const expoSignature = req.headers['expo-signature'];
  // process.env.SECRET_WEBHOOK_KEY has to match SECRET value set with `eas webhook:create` command
  const hmac = crypto.createHmac('sha1', process.env.SECRET_WEBHOOK_KEY);
  hmac.update(req.body);
  const hash = `sha1=${hmac.digest('hex')}`;
  if (!safeCompare(expoSignature, hash)) {
    res.status(500).send("Signatures didn't match!");
  } else {
    // do something here, like send a notification to Slack!
    // console.log(req.body);
    res.send('OK!');
  }
});
app.listen(8080, () => console.log('Listening on port 8080'));
```

---
title: Webhooks
---

import { ConfigClassic } from '~/components/plugins/ConfigSection';
import { Collapsible } from '~/ui/components/Collapsible';

EAS can alert you as soon as your build or submission has completed via a webhook. Webhooks need to be configured per-project, so if you want to be alerted for both `@johndoe/awesomeApp` and `@johndoe/coolApp`, you need to run `eas webhook:create` in each directory.

<ConfigClassic>

Webhooks function almost exactly the same for both EAS Build and the classic `expo build` system, _except_ that for `expo build` webhooks, you'll use `expo-cli` to interact with them, and **not** `eas-cli`. For `expo build` webhooks, you'll use:

- `expo webhooks [path]`: List all webhooks for a project
- `expo webhooks:add [path]`: Add a webhook to a project
- `expo webhooks:remove [path]`: Delete a webhook
- `expo webhooks:update [path]`: Update an existing webhook

</ConfigClassic>

After running `eas webhook:create`, you'll be prompted to choose the webhook event type (unless you provide the `--event BUILD|SUBMIT` parameter). Next, provide the webhook URL (or specify it with the `--url` flag) that handles HTTP POST requests. Additionally, you'll have to input a webhook signing secret, if you have not already provided it with the `--secret` flag. It must be at least 16 characters long, and it will be used to calculate the signature of the request body which we send as the value of the `expo-signature` HTTP header. You can use the signature to verify a webhook request is genuine (example code below).

EAS calls your webhook using an HTTP POST request. All the data is passed in the request body. EAS sends the data as a JSON object.

Additionally, we send an `expo-signature` HTTP header with the hash signature of the payload. You can use this signature to verify the authenticity of the request. The signature is a hex-encoded HMAC-SHA1 digest of the request body, using your webhook secret as the HMAC key.

> If you want to test the above webhook locally, you have to use a service like [ngrok](https://ngrok.com/docs) to forward `localhost:8080` via a tunnel and make it publicly accessible with the URL `ngrok` gives you.

You can always change your webhook URL and/or webhook secret using `eas webhook:update --id WEBHOOK_ID`. You can find the webhook ID by running `eas webhook:list`. If you would like us to stop sending requests to your webhook, run `eas webhook:delete` and choose the webhook from the list.

## Webhook payload

<Collapsible summary="Build webhook payload">

The build webhook payload looks something like this:

```json
{
  "id": "147a3212-49fd-446f-b4e3-a6519acf264a",
  "appId": "bc0a82de-65a5-4497-ad86-54ff1f53edf7",
  "initiatingUserId": "d1041496-1a59-423a-8caf-479bb978203a",
  "cancelingUserId": null, // available for canceled builds
  "platform": "android", // or "ios"
  "status": "errored", // or: "finished", "canceled"
  "artifacts": {
    "buildUrl": "https://expo.dev/artifacts/eas/wyodu9tua2ZuKKiaJ1Nbkn.aab", // available for successful builds
    "logsS3KeyPrefix": "production/f9609423-5072-4ea2-a0a5-c345eedf2c2a"
  },
  "metadata": {
    "appName": "example",
    "username": "dsokal",
    "workflow": "managed",
    "appVersion": "1.0.2",
    "cliVersion": "0.37.0",
    "sdkVersion": "41.0.0",
    "buildProfile": "production",
    "distribution": "store",
    "appIdentifier": "com.expo.example",
    "gitCommitHash": "564b61ebdd403d28b5dc616a12ce160b91585b5b",
    "": "default",
    "appBuildVersion": "6",
    "trackingContext": {
      "platform": "android",
      "account_id": "7c34cbf1-efd4-4964-84a1-c13ed297aaf9",
      "dev_client": false,
      "project_id": "bc0a82de-65a5-4497-ad86-54ff1f53edf7",
      "tracking_id": "a3fdefa7-d129-42f2-9432-912050ab0f10",
      "project_type": "managed",
      "dev_client_version": "0.6.2"
    },
    "credentialsSource": "remote",
    "isGitWorkingTreeDirty": false
  },
  "metrics": {
    "memory": 895070208,
    "buildEndTimestamp": 1637747861168,
    "totalDiskReadBytes": 692224,
    "buildStartTimestamp": 1637747834445,
    "totalDiskWriteBytes": 14409728,
    "cpuActiveMilliseconds": 12117.540078,
    "buildEnqueuedTimestamp": 1637747792476,
    "totalNetworkEgressBytes": 355352,
    "totalNetworkIngressBytes": 78781667
  },
  // available for failed builds
  "error": {
    "message": "Unknown error. Please see logs.",
    "errorCode": "UNKNOWN_ERROR"
  },
  "createdAt": "2021-11-24T09:53:01.155Z",
  "updatedAt": "2021-11-24T09:57:42.715Z",
  "expirationDate": "2021-12-24T09:53:01.155Z"
}
```

</Collapsible>

<Collapsible summary="Submit webhook payload">

The submit webhook payload looks something like this:

```json
{
  "id": "0374430d-7776-44ad-be7d-8513629adc54",
  "appId": "23c0e405-d282-4399-b280-5689c3e1ea85",
  "initiatingUserId": "7bee4c21-3eaa-4011-a0fd-3678b6537f47",
  "turtleBuildId": "8c84111e-6d39-449c-9895-071d85fd3e61", // available when submitting a build from EAS
  "platform": "android", // or "ios"
  "status": "errored", // or: "finished", "canceled"
  "submissionInfo": {
    // available for failed submissions
    "error": {
      "message": "Android version code needs to be updated",
      "errorCode": "SUBMISSION_SERVICE_ANDROID_OLD_VERSION_CODE_ERROR"
    },
    "logsUrl": "https://submission-service-logs.s3-us-west-1.amazonaws.com/production/submission_728aa20b-f7a9-4da7-9b64-39911d427b19.txt"
  },
  "createdAt": "2021-11-24T10:15:32.822Z",
  "updatedAt": "2021-11-24T10:15:32.822Z"
}
```

</Collapsible>

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

---
title: Environment variables and secrets
---

The ["Environment variables in Expo"](/guides/environment-variables.md) guide presents several options for how you can access system environment variables to your app JavaScript code. This can be a useful way to inject values in your code, but [these values should not be secrets](/guides/environment-variables.md#security-considerations), and so the value it provides can be summarized as a convenience for accommodating certain development workflows.

Using the techniques described in the environment variables document above, environment variables are inlined (the `process.env.X` text is replaced with it's evaluated result) in your app's JavaScript code _at the the time that the app is built_, and included in the app bundle. This means that the substitution would occur on EAS Build servers and not on your development machine, so if you tried to run a build on EAS Build without the environment variables present you would encounter errors.

In similar situations, you would typically resolve this by configuring the environment variables on the remote server, however **it is not currently possible to set environment variables on EAS Build jobs**.

> 💡 You can actually control exactly one environment variable currently: the `npmToken` property in `credentials.json` sets the `NPM_TOKEN` environment variable in order to give you access to your organization's private packages. [Learn more](how-tos.md).

## Making your app that depends on environment variables compatible with EAS Build

If you use environment variables as described above, you will need to modify your application in order to account for this. Given that you should not be providing any secrets in these variables, one way to work around this is to create a JavaScript file that reads the environment variables and provides fallbacks when they aren't present:

```js
// Constants.ts

export default {
  API_URL: process.env.MY_APP_API_URL ?? 'https://production.cool',
};
```

Now import `Constants.ts` and use this throughout your codebase instead of `process.env.API_URL`.

🎉 It's a little bit cleaner and now your project is compatible with EAS Build!
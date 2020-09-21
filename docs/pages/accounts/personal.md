---
title: Personal Account
---

To fully use Expo, you have to create a Personal Account. With this account, we can safely identify you as the developer or owner of an app. You can use Personal Accounts for all features Expo has to offer.

This account is just for you, **never share access to this account for any reason.**

## Programmatic Access

When setting up CI or writing a script to help manage your projects, we recommend avoiding using your username and password to authenticate. With these credentials, anyone would be able to log in and use your account.

Instead of providing credentials, you can generate Personal Access Tokens that will allow you to manage each integration point separately. Anyone who has access to these tokens will be able to perform actions against your account. Please treat them with the same care as a user password. In case something is leaked, you can revoke these tokens to block access.

### Personal Access Tokens

You can create Personal Access Tokens from the [Access Tokens page](https://expo.io/dashboard/[account]/settings/access-tokens) on your dashboard. Anyone with this token can perform actions on behalf of your account. That applies to all content within your personal account.

### Using Access Tokens

You can use any tokens you have created to perform actions with the Expo CLI (other than signing in and out). To use tokens, you need to define an environment variable, like `EXPO_TOKEN="token"`, before running commands.

If you are using Github Actions, you can configure the `expo-token` property to include this environment variable in all of the job steps ([https://github.com/expo/expo-github-action#configuration-options](https://github.com/expo/expo-github-action#configuration-options)).

Common situations where access tokens are useful:

- Publish or build from CI without providing your Expo username and password
- Renew a token to keep it as secure as possible; no need to reset your password and sign out of all sessions
- Give someone (or a script) one-time access to your project with limited permissions

### Revoking Access Tokens

In case a token was accidentally leaked, you can revoke it without changing your username and password. When you revoke the access token, you block all access to your account using this token. To do this, go to the [Access Token page](https://expo.io/dashboard/[account]/settings/access-tokens) on your dashboard and delete the token you want to revoke.

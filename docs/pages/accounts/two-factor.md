---
title: Two-Factor Authentication
---

Two-factor authentication provides an extra layer of security when logging in to expo.dev, the Expo Go app, and command line tools.  With two-factor authentication enabled, you will need to provide a short-lived code in addition to your username and password to access your account.

## Enabling Two-Factor Authentication (2FA)

You can enable two-factor authentication from your [personal account settings](https://expo.dev/settings).

## Two-Factor Authentication Methods

You can receive 2FA codes through an authenticator app or via SMS message.

### Authenticator Apps

Expo accepts any authenticator app that supports Time-based One-time Passwords (TOTP) including:

- [Last Pass Authenticator](https://lastpass.com/auth/)
- [Authy](https://authy.com/)
- [1Password](https://support.1password.com/one-time-passwords/)
- [Google Authenticator](https://support.google.com/accounts/answer/1066447)
- [Microsoft Authenticator](https://www.microsoft.com/en-us/account/authenticator)

Expo will provide a QR code to scan with your authenticator app during setup.  The app will provide a confirmation code to enter on Expo. Enter the code to finish activating 2FA via your authenticator app. 

### SMS Messages

Provide a mobile phone number to receive a short-lived token via SMS. Codes received via SMS will be valid for at least 10 minutes, so you may receive the same code multiple times within this window.

> **Note:** If you set an SMS device as your default 2FA method, you will be sent a verification code automatically whenever you take an action that requires a 2FA code.

### Recovery Codes

As part of setting up two-factor authentication on your account you will receive a list of recovery codes.  These codes may be used in place of a one-time password if you lose access to the device(s) that have your authenticator app or that you use to receive SMS messages.  Each recovery code may only be used once.

If you chose to download your recovery codes when they were generated, they will be found in a file named `expo-recovery-codes.txt`

> **Note:** Store your recovery codes in a secure and memorable place to ensure you, and only you, can access your account!

## Changing Your Two-Factor Settings

You can make changes to your two-factor settings from your [personal account settings](https://expo.dev/settings).  You can:

- add or remove authentication methods
- set your default method
- regenerate your recovery codes
- disable two-factor authentication for your account

You will need to provide a one-time password to make any changes to your 2FA settings.

## Recovering Your Account

### Recovery Codes

When you set up your account to use 2FA, Expo provides you with a list of recovery codes. In the event you lose your device(s), a recovery code may be used in place of a one-time password. Each of these codes may only be used once. You may regenerate your recovery codes, which will invalidate any existing codes, from your [personal account settings](https://expo.dev/settings/).

### Secondary 2FA Methods

By setting up multiple authentication methods associated with different physical devices, you can ensure you will not lose access to your account in the event a device is reset or lost.

### Manual Recovery

If you cannot access your account through any of the supplied methods, you may email Expo support from the email associated with your account.  Unfortunately, we cannot guarantee we will be able to restore your access to your account in this scenario.

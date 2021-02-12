---
title: Two-Factor Authentication
---

Two factor authentication provides an extra layer of security when logging in to expo.io, the Expo Go app, and command line tools.  With 2FA enabled, you will need to provide a secure code in addition to your username and password to access your account.

## Enabling Two-Factor Authentication (2FA)

You can enable two-factor authentication from your [personal account settings](https://expo.io/settings).

## Two-Factor Authentication Methods

You can receive 2FA codes through an authenticator app or via SMS message

### Authenticator Apps

Expo accepts any authenticator app that supports Time-based One-time Passwords (TOTP), such as the following:

- Last Pass Authenticator
- Authy
- 1Password
- Google Authenticator
- Microsoft Authenticator

Expo will provide a QR code for scanning with your authenticator app. Open your app of choice, and scan the QR Code. The app will provide a confirmation code to enter on Expo. Enter the code to finish activating 2FA via your authenticator app. 

### SMS Messages

Provide a mobile phone number to receive a short-lived token from Expo. Once you enter the one-time password, your mobile phone number will be used for 2FA when logging into your account.  Codes received via SMS will be valid for at least 10 minutes, so you may receive the same code if you request a token more than once within this window.

> **Note:** If you set an SMS device as your default 2FA method, you will be sent a verification code automatically whenever you take an action that requires a 2FA code.

### Recovery Codes

As part of setting up your account to use two-factor authentication you will receive a list of recovery codes.  These codes can be entered anywhere you need to provide a one-time password if you lose access to the device(s) that have your authenticator app or that you use to receive SMS messages.  Once you use a recovery code, you will not be able to use it again.

If you chose to download your recovery codes when they were generated, they will be found in a file named `expo-recovery-codes.txt`

> **Note:** Store your recovery codes in a secure and memorable place to ensure you, and only you, can access your account!

## Changing Your Two-Factor Settings

You can make changes to your two-factor settings from your [personal account settings](https://expo.io/settings).  You can:

- add or remove authentication methods
- set your default method
- regenerate your recovery codes
- disable two-factor authentication for your account

You will need to provide a verification code before any changes to your 2FA settings will be applied.

## Recovering Your Account

### Recovery Codes

While setting up 2FA, Expo provides you with recovery codes. In the event you lose your 2FA method, Expo will ask for these recovery codes to unlock 2FA. These codes are for one-time use and will no longer work after they are used to recover your account. To get new recovery codes, you'll need to reset your 2FA method.

### Secondary 2FA Methods

By setting up multiple authentication methods associated with different physical devices, you can ensure you will not lose access to your account in the event you lose access to an individual device.

### Manual Recovery

If you cannot access your account through any of the supplied methods, you may email Expo support from the email associated with your account.  Unfortunately, we cannot guarantee we will be able to restore your access to your account in this scenario.
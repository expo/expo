---
title: Code Signing
---

import Head from '~/components/Head'

<Head title="EAS Update Code Signing" />

> ⚠️ Expo Updates code signing is in early beta, meaning that it is not yet ready for use in production apps. We may still make breaking changes to the developer-facing portion and the end-user portion as well.

> EAS Update Code Signing is only available to accounts subscribed to the EAS Enterprise plan. [Sign up](https://expo.dev/pricing).

## Introduction

The `expo-updates` library supports end-to-end code signing. Code signing allows developers to cryptographically sign their updates with their own keys. The signatures are then verified on the client before the update is applied, which ensures ISPs, CDNs, cloud providers, and even EAS itself cannot tamper with updates run by apps.

## Code Signing with EAS Update

1. Generate a private key and corresponding code signing certificate for your app:

   ```bash
   npx expo-updates codesigning:generate \
     --key-output-directory keys \
     --certificate-output-directory certs \
     --certificate-validity-duration-years 10 \
     --certificate-common-name "My App"
   ```

   The generated private key must be kept private and secure.

2. Configure your app's builds to use code signing:

   ```bash
   npx expo-updates codesigning:configure \
     --certificate-input-directory certs \
     --key-input-directory keys
   ```

   After this step, create a new build with a new runtime version. The code signing certificate will be embedded in this new build.

3. Publish a signed update for your app:

   ```bash
   eas update --private-key-path keys/private-key.pem
   ```

   During `eas update`, the EAS CLI automatically detects that code signing is configured for your app. It then verifies the integrity of the update and creates a digital signature using your private key. This process is performed locally so that your private key never leaves your machine. The generated signature is automatically sent to EAS to store alongside the update.

4. Download the update on the client (this step is done automatically by the library). The build from step (2) that is configured for code signing checks if there is a new update available. The server responds with the update published in step (3) and its generated signature. After being downloaded but before being applied, the update is verified against the embedded certificate and included signature. The update is applied if the signature is valid, and rejected otherwise.

## Key Rotation

Key rotation is the process by which the key pair used for signing updates is changed. This is most commonly done in a few cases:

- Key expiration. In step (1) from the section above, we set `certificate-validity-duration-years` to 10 years (though it can be configured to any value). This means that after 10 years, updates signed with the private key corresponding to the certificate will no longer be valid.
- Private key compromise. If the private key used to sign updates is accidentally exposed to the public, it can no longer be considered secure and therefore can no longer guarantee itegrity of updates it signed. For example, a malicious actor could craft a malicious update and sign it with the leaked private key.
- Key rotation for security best practices. It is best practice to rotate keys periodically to ensure that a system is resilient to manual key rotation in response to one of the other reasons above.

In any of these cases, a new key must be generated and new updates must be signed with the new key. To do this, backup the old key and certificate generated in step (1) and re-run the full set of steps above. A new runtime version must be used for the new build to ensure that only updates signed with the new key are run in the new build.

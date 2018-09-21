# Expo Secrets

This directory contains keys and other data that is for only the Expo team. Expo's software works without these secrets, which are used to configure the official Expo client and connect to services that Expo uses.

---

## Expo team instructions

### Security

This directory contains only secrets that cannot cause significant damage or create significant work for us if they are exposed. It also contains data that isn't actually secret, such as client API keys, but that belong only in the official releases of Expo software and we want to prevent from accidentally being included in developers' own builds.

In the interest of defense in depth, we mitigate the consequences of these secrets being exposed. **Do not add especially sensitive or hard-to-revoke secret credentials, such as an Android keystore, to this repository or CI, even if they are encrypted.**

We also require full-disk encryption (FileVault 2) to decrypt the secrets.

### Unlocking the secrets

The secrets are encrypted using [`git-crypt`](https://github.com/AGWA/git-crypt). Run `unlock` in this repo to decrypt the secrets. If you do not have a decryption key, `unlock` will print instructions for you. You also must have full-disk encryption (FileVault 2) enabled to decrypt the secrets.

The secrets will remain decrypted on your local computer but will automatically be encrypted when you push your changes to GitHub.

### Locking the secrets

You can encrypt the secrets again by running `lock`. You should rarely need to lock the secrets, but if you encounter issues with `git-crypt` it may be useful. Locking the secrets does not protect them unless you securely delete the key and your ability to acquire another copy of the key, however.

# Expo Secrets

This directory contains keys and other data that is for only the Expo team. Expo's software works without these secrets, which are used to configure the official Expo client and connect to services that Expo uses.

---

## Expo team instructions

### Security

This directory contains only secrets that cannot cause significant damage or create significant work for us if they are exposed. It also contains data that isn't actually secret, such as client API keys, but that belong only in the official releases of Expo software and we want to prevent from accidentally being included in developers' own builds.

In the interest of defense in depth, we mitigate the consequences of these secrets being exposed. **Do not add especially sensitive or hard-to-revoke secret credentials, such as an Android keystore, to this repository or CI, even if they are encrypted.**

Secrets are stored in Google Cloud Secret Manager and synced locally when needed.

### Unlocking the secrets

The secrets are stored in Google Cloud Secret Manager. Run `./bin/unlock` in this repo to fetch and decrypt the secrets to your local machine.

**Prerequisites:**
- Google Cloud SDK installed (`brew install google-cloud-sdk`)
- Authenticated with gcloud (`gcloud auth login`)
- Project set (`gcloud config set project exponentjs`)
- Access to the `exponentjs` project with `services-secrets-accessor` rights ([request access](https://console.cloud.google.com/iam-admin/pam/entitlements/my?project=exponentjs))

The unlocked secrets will remain on your local computer in the `secrets/` directory but are gitignored and will not be committed to the repository.

### Locking the secrets

You can remove the secrets from your local directory by running `./bin/lock`. This replaces the secret files with placeholder templates that contain instructions for unlocking.

### Secret files

- **keys.json**: Configuration keys for various services (GCP secret: `expo-expo-keys-json`)
- **expotools.env**: Environment variables for build tools (GCP secret: `expo-expotools-env`)

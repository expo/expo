# Expo Secrets

This directory previously contained encrypted keys and data for the Expo team. **These secrets have been migrated to Google Cloud Secret Manager**.

---

## Expo team instructions

### Security

Secrets are now stored in Google Cloud Secret Manager. Do not add secret credentials to this repository or CI systems.

### Accessing secrets

Secrets are now accessed via Google Cloud Secret Manager:

#### Keys (previously `keys.json`)

- **Secret Name**: `expo-expo-keys-json` (configurable via `EXPO_KEYS_SECRET_NAME`)
- **Access**: `gcloud secrets versions access latest --secret expo-expo-keys`
- **Usage**: Automatically handled by build tools

#### Environment Variables (previously `expotools.env`)

- **Secret Name**: `expo-expotools-env` (configurable via `EXPO_EXPOTOOLS_SECRET_NAME`)
- **Format**: JSON object with key-value pairs
- **Access**: `gcloud secrets versions access latest --secret expo-expotools-env`
- **Usage**:
  ```bash
  secrets=$(gcloud secrets versions access latest --secret expo-expotools-env)
  eval "export $(echo "$secrets" | jq -r 'to_entries | map("\(.key)=\(.value)") | @sh')"
  ```

### Setting up access

1. Ensure you have Google Cloud SDK installed: `brew install google-cloud-sdk`
2. Authenticate: `gcloud auth login`
3. Set project: `gcloud config set project [exponentjs project id]`
4. Verify access: `gcloud secrets list`

### For CI/CD

Use service account keys with appropriate permissions for automated access:
- Set `GCP_SERVICE_ACCOUNT_KEY` environment variable (base64 encoded JSON)
- Use the updated GitHub Actions and EAS build scripts

import * as SecureStore from 'expo-secure-store';
import uuidv4 from 'uuid/v4';

const INSTALLATION_ID_KEY = 'installationId';

export default async function getInstallationIdAsync() {
  const existingInstallationId = await SecureStore.getItemAsync(INSTALLATION_ID_KEY);
  if (existingInstallationId) {
    return existingInstallationId;
  }

  const newInstallationId = uuidv4();
  await SecureStore.setItemAsync(INSTALLATION_ID_KEY, newInstallationId, {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  });
  return newInstallationId;
}

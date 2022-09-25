export const IS_MANAGED_ENV = false;
export const IS_ENV_WITH_UPDATES_ENABLED = false;
export const IS_ENV_WITHOUT_UPDATES_ENABLED = false;

// Compute manifest base URL if available
export const manifestBaseUrl = null;

export async function downloadAsync(uri, hash, type, name): Promise<string> {
  return uri;
}

export function getManifest() {
  return {};
}

export function getManifest2() {
  return {};
}

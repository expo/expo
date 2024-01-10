export const IS_ENV_WITH_UPDATES_ENABLED = false;

// Compute manifest base URL if available
export const manifestBaseUrl = null;

export async function downloadAsync(
  url: string,
  _hash: string | null,
  _type: string
): Promise<string> {
  return url;
}

export function getManifest() {
  return {};
}

export function getManifest2() {
  return {};
}

import ExpoOTA from './ExpoOTA';

export async function checkForUpdateAsync() {
  return ExpoOTA.checkForUpdateAsync();
}

export async function reload() {
  return ExpoOTA.reload();
}

export async function reloadFromCache() {
  return ExpoOTA.reloadFromCache();
}

export async function fetchUpdatesAsync() {
  return ExpoOTA.fetchUpdatesAsync();
}

export async function clearUpdateCacheAsync() {
  return ExpoOTA.clearUpdateCacheAsync();
}

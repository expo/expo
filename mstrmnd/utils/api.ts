import Constants from 'expo-constants';

export const generateAPIUrl = (relativePath: string) => {
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;

  const experienceUrl =
    Constants.experienceUrl ??
    (Constants as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig
      ?.debuggerHost ??
    Constants.expoConfig?.hostUri;

  if (process.env.NODE_ENV === 'development' && experienceUrl) {
    const origin = String(experienceUrl)
      .replace('exp://', 'http://')
      .replace(/\/--\/.*$/, '')
      .replace(/:8081.*/, ':8081');

    if (origin.startsWith('http')) {
      return origin.concat(path);
    }

    return `http://${origin}`.replace(/\/$/, '').concat(path);
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.concat(path);
  }

  if (!process.env.EXPO_PUBLIC_API_BASE_URL) {
    return path;
  }

  return process.env.EXPO_PUBLIC_API_BASE_URL.replace(/\/$/, '').concat(path);
};

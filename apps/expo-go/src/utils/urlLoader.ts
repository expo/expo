import * as Linking from 'expo-linking';

export function isValidExpoUrl(url: string): boolean {
  return url.startsWith('exp://');
}

export async function loadExpoUrl(url: string): Promise<boolean> {
  // Simulate deep link opening (similar to QR code scan)
  return Linking.openURL(url);
}

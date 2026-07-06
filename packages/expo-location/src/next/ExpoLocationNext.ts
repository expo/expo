import { requireNativeModule } from 'expo';

export const LocationNext = requireNativeModule('LocationNextModule');

export async function testF(): Promise<string> {
  return await LocationNext.TestFunction();
}

export async function GetCurrentLocation(
  provider: 'FUSED' | 'GPS' | 'NETWORK' | 'PASSIVE'
): Promise<{ longitude: number; latitude: number }> {
  console.log('Before request');
  const res = await LocationNext.GetCurrentLocation(provider);
  console.log(res);
  return res;
}

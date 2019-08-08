import * as Network from 'expo-network';
import { Platform } from 'react-native';

export const name = 'Network';
export async function test(t) {
  t.describe(`Network.getIpAddressAsync()`, () => {
    t.it(`throws error when the device's offline`, async () => {
      let IpAddress;
      let error;
      try {
        IpAddress = await Network.getIpAddressAsync();
      } catch (e) {
        error = e;
      }
      if (navigator.onLine === false) {
        t.expect(typeof IpAddress).toEqual('undefined');
        t.expect(error).toBeDefined();
      }
    });
  });
}

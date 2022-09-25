import * as Network from 'expo-network';
import { Platform } from 'react-native';

export const name = 'Network';
const Ipv4Regex =
  /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

export async function test(t) {
  if (Platform.OS === 'android') {
    t.describe(`Network.isAirplaneModeEnabledAsync()`, async () => {
      t.it(`returns a boolean`, async () => {
        const isAirplaneModeOn = await Network.isAirplaneModeEnabledAsync();
        t.expect(isAirplaneModeOn).toBeDefined();
        t.expect(typeof isAirplaneModeOn).toBe('boolean');
      });
      t.it(`throws error Network.getIpAddressAsync() if Airplane mode is on`, async () => {
        const isAirplaneModeOn = await Network.isAirplaneModeEnabledAsync();
        if (isAirplaneModeOn) {
          let ipAddress;
          let error;
          try {
            ipAddress = await Network.getIpAddressAsync();
          } catch (e) {
            error = e;
          }
          t.expect(error).toBeDefined();
          t.expect(typeof ipAddress).toEqual('undefined');
        }
      });
      t.it(`throws error Network.getNetworkStateAsync() if Airplane mode is on`, async () => {
        const isAirplaneModeOn = await Network.isAirplaneModeEnabledAsync();
        if (isAirplaneModeOn) {
          let networkState;
          let error;
          try {
            networkState = await Network.getNetworkStateAsync();
          } catch (e) {
            error = e;
          }
          t.expect(error).toBeDefined();
          t.expect(typeof networkState).toEqual('undefined');
        }
      });
    });
  }
  t.describe(`Network.getIpAddressAsync()`, () => {
    t.it(`gets valid IPV4 address when device's online`, async () => {
      let ipAddress;
      let error;
      try {
        ipAddress = await Network.getIpAddressAsync();
      } catch (e) {
        error = e;
      }
      t.expect(typeof ipAddress).toEqual('string');
      t.expect(typeof error).toEqual('undefined');
      t.expect(Ipv4Regex.test(ipAddress)).toBeTruthy();
    });
  });
  t.describe(`Network.getNetworkStateAsync()`, () => {
    t.it(`gets valid NetworkState types and valid NetworkStateType enums`, async () => {
      function validateBoolean(result) {
        t.expect(result).toBeDefined();
        t.expect(typeof result).toBe('boolean');
      }
      let error;
      try {
        const { type, isConnected, isInternetReachable } = await Network.getNetworkStateAsync();
        validateBoolean(isConnected);
        validateBoolean(isInternetReachable);
        t.expect(Object.values(Network.NetworkStateType).includes(type)).toBeTruthy();
        t.expect(typeof error).toEqual('undefined');
      } catch (e) {
        error = e;
      }
    });
  });
}

import * as Network from 'expo-network';
import { Platform } from 'react-native';

export const name = 'Network';
let Ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
let macAddressRegex = /^([0-9a-fA-F]{2}[:.-]){5}[0-9a-fA-F]{2}$/;

// make ajax calls to check Internet connection
let checkConnection = async () => {
  let status = response => {
    if (response.status >= 200 && response.status < 300) {
      return Promise.resolve(response);
    } else {
      return Promise.reject(new Error(response.statusText));
    }
  };

  let json = response => {
    return response.json();
  };

  let result = await fetch('https://api.ipify.org?format=json')
    .then(status)
    .then(json)
    .then(data => {
      //Request succeeded with JSON response
      return true;
    })
    .catch(error => {
      //Request failed
      return false;
    });
  return result;
};
export async function test(t) {
  if (Platform.OS === 'android') {
    t.describe(`Network.isAirplaneModeEnabledAsync()`, async () => {
      t.it(`returns a boolean and false when with Internet connection`, async () => {
        let isAirplaneModeOn = await Network.isAirplaneModeEnabledAsync();
        t.expect(isAirplaneModeOn).toBeDefined();
        t.expect(typeof isAirplaneModeOn).toBe('boolean');
        if (!isAirplaneModeOn) {
          let connection = await checkConnection();
          t.expect(connection).toEqual(true);
        }
      });
    });
  }
  t.describe(`Network.getIpAddressAsync()`, () => {
    t.it(`throws error when device's offline`, async () => {
      let IpAddress;
      let error;
      try {
        IpAddress = await Network.getIpAddressAsync();
      } catch (e) {
        error = e;
      }
      if (navigator.onLine === false) {
        t.expect(error).toBeDefined();
        t.expect(typeof IpAddress).toEqual('undefined');
      }
    });
    t.it(`gets IPV4 address when device's online`, async () => {
      let ipAddress;
      let error;
      try {
        ipAddress = await Network.getipAddressAsync();
        console.log(ipAddress);
      } catch (e) {
        error = e;
      }
      if (navigator.onLine === true) {
        t.expect(typeof IpAddress).toEqual('string');
        t.expect(typeof error).toEqual('undefined');
        t.expect(Ipv4Regex.test(ipAddress)).toBeTruthy();
      }
    });
  });
  t.describe(`Network.getMacAddressAsync()`, () => {
    t.it(`returns valid mac address when pass in no network interface name`, async () => {
      let macAddress;
      let error;
      try {
        macAddress = await Network.getmacAddressAsync();
      } catch (e) {
        error = e;
      }
      if (Platform.OS === 'android') {
        let isAirplaneModeOn = Network.isAirplaneModeEnabledAsync();
        if (!isAirplaneModeOn) {
          t.expect(typeof error).toEqual('undefined');
          t.expect(macAddress).toBeDefined();
          t.expect(macAddressRegex.test(macAddress)).toBeTruthy();
        }
      } else {
        t.expect(typeof error).toEqual('undefined');
        t.expect(macAddress).toBeDefined();
        t.expect(macAddressRegex.test(macAddress)).toBeTruthy();
      }
    });
    if (Platform.OS === 'android') {
      t.it(`throws error when pass in invalid network interface name`, async () => {
        let macAddress;
        let error;
        try {
          macAddress = await Network.getmacAddressAsync('helloworld');
        } catch (e) {
          error = e;
        }
        t.expect(error).toBeDefined();
        t.expect(typeof macAddress).toEqual('undefined');
      });
    }
  });
}

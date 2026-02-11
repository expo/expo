import {
  createPermissionHook,
  PermissionStatus,
  Platform,
  UnavailabilityError,
} from 'expo-modules-core';

import { CellularGeneration, PermissionResponse } from './Cellular.types';
import ExpoCellular from './ExpoCellular';

export { CellularGeneration };

// @needsAudit
/**
 * @return Returns a promise which fulfils with a [`Cellular.CellularGeneration`](#cellulargeneration)
 * enum value that represents the current cellular-generation type.
 *
 * You need to check if the native permission has been accepted to obtain generation.
 * If the permission is denied, `getCellularGenerationAsync` resolves with `Cellular.CellularGeneration.UNKNOWN`.
 *
 * On web, this method uses [`navigator.connection.effectiveType`](https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/effectiveType)
 * to detect the effective type of the connection using a combination of recently observed
 * round-trip time and downlink values. See [here](https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API)
 * to view browser compatibility.
 *
 * @example
 * ```ts
 * await Cellular.getCellularGenerationAsync();
 * // CellularGeneration.CELLULAR_4G
 * ```
 */
export async function getCellularGenerationAsync(): Promise<CellularGeneration> {
  if (!ExpoCellular.getCellularGenerationAsync) {
    throw new UnavailabilityError('expo-cellular', 'getCellularGenerationAsync');
  }
  return await ExpoCellular.getCellularGenerationAsync();
}

/**
 * @return Returns if the carrier allows making VoIP calls on its network. On Android, this checks whether
 * the system supports SIP-based VoIP API. See [here](https://developer.android.com/reference/android/net/sip/SipManager.html#isVoipSupported(android.content.Context))
 * to view more information.
 *
 * On iOS, if you configure a device for a carrier and then remove the SIM card, this property
 * retains the `boolean` value indicating the carrier’s policy regarding VoIP. If you then install
 * a new SIM card, its VoIP policy `boolean` replaces the previous value of this property.
 *
 * On iOS and web, this returns `null`.
 *
 * @platform android
 *
 * @example
 * ```ts
 * await Cellular.allowsVoipAsync(); // true or false
 * ```
 */
export async function allowsVoipAsync(): Promise<boolean | null> {
  if (Platform.OS === 'ios') {
    return null;
  }
  if (!ExpoCellular.allowsVoipAsync) {
    throw new UnavailabilityError('expo-cellular', 'allowsVoipAsync');
  }
  return await ExpoCellular.allowsVoipAsync();
}

/**
 * @return Returns the ISO country code for the user’s cellular service provider.
 *
 * On iOS, the value is `null` if any of the following apply:
 * - The device is in airplane mode.
 * - There is no SIM card in the device.
 * - The device is outside of cellular service range.
 *
 * On iOS and web, this returns `null`.
 *
 * @platform android
 *
 * @example
 * ```ts
 * await Cellular.getIsoCountryCodeAsync(); // "us" or "au"
 * ```
 *
 */
export async function getIsoCountryCodeAsync(): Promise<string | null> {
  if (Platform.OS === 'ios') {
    return null;
  }
  if (!ExpoCellular.getIsoCountryCodeAsync) {
    throw new UnavailabilityError('expo-cellular', 'getIsoCountryCodeAsync');
  }
  return await ExpoCellular.getIsoCountryCodeAsync();
}

/**
 * @return Returns name of the user’s home cellular service provider. If the device has dual SIM cards, only the
 * carrier for the currently active SIM card is returned.
 *
 * On Android, this value is only available when the SIM state is [`SIM_STATE_READY`](https://developer.android.com/reference/android/telephony/TelephonyManager.html#SIM_STATE_READY).
 * Otherwise, this returns `null`.
 *
 * On iOS and web, this returns `null`.
 *
 * @platform android
 *
 * @example
 * ```ts
 * await Cellular.getCarrierNameAsync(); // "T-Mobile" or "Verizon"
 * ```
 */
export async function getCarrierNameAsync(): Promise<string | null> {
  if (Platform.OS === 'ios') {
    return null;
  }
  if (!ExpoCellular.getCarrierNameAsync) {
    throw new UnavailabilityError('expo-cellular', 'getCarrierNameAsync');
  }
  return await ExpoCellular.getCarrierNameAsync();
}

/**
 * @return Returns mobile country code (MCC) for the user’s current registered cellular service provider.
 *
 * On Android, this value is only available when SIM state is [`SIM_STATE_READY`](https://developer.android.com/reference/android/telephony/TelephonyManager.html#SIM_STATE_READY). Otherwise, this
 * returns `null`. On iOS, the value may be null on hardware prior to iPhone 4S when in airplane mode.
 * Furthermore, the value for this property is `null` if any of the following apply:
 * - There is no SIM card in the device.
 * - The device is outside of cellular service range.
 *
 * On iOS and web, this returns `null`.
 *
 * @platform android
 *
 * @example
 * ```ts
 * await Cellular.getMobileCountryCodeAsync(); // "310"
 * ```
 */
export async function getMobileCountryCodeAsync(): Promise<string | null> {
  if (Platform.OS === 'ios') {
    return null;
  }
  if (!ExpoCellular.getMobileCountryCodeAsync) {
    throw new UnavailabilityError('expo-cellular', 'getMobileCountryCodeAsync');
  }
  return await ExpoCellular.getMobileCountryCodeAsync();
}

/**
 * @return Returns the mobile network code (MNC) for the user’s current registered cellular service provider.
 *
 * On Android, this value is only available when SIM state is [`SIM_STATE_READY`](https://developer.android.com/reference/android/telephony/TelephonyManager.html#SIM_STATE_READY). Otherwise, this
 * returns `null`. On iOS, the value may be null on hardware prior to iPhone 4S when in airplane mode.
 * Furthermore, the value for this property is `null` if any of the following apply:
 * - There is no SIM card in the device.
 * - The device is outside of cellular service range.
 *
 * On iOS and web, this returns `null`.
 *
 * @platform android
 *
 * @example
 * ```ts
 * await Cellular.getMobileNetworkCodeAsync(); // "310"
 * ```
 */
export async function getMobileNetworkCodeAsync(): Promise<string | null> {
  if (Platform.OS === 'ios') {
    return null;
  }
  if (!ExpoCellular.getMobileNetworkCodeAsync) {
    throw new UnavailabilityError('expo-cellular', 'getMobileNetworkCodeAsync');
  }
  return await ExpoCellular.getMobileNetworkCodeAsync();
}

/**
 * Checks user's permissions for accessing phone state.
 */
export async function getPermissionsAsync(): Promise<PermissionResponse> {
  if (Platform.OS === 'android') {
    return await ExpoCellular.getPermissionsAsync();
  }

  return {
    status: PermissionStatus.GRANTED,
    expires: 'never',
    granted: true,
    canAskAgain: true,
  };
}

/**
 * Asks the user to grant permissions for accessing the phone state.
 */
export async function requestPermissionsAsync(): Promise<PermissionResponse> {
  if (Platform.OS === 'android') {
    return await ExpoCellular.requestPermissionsAsync();
  }

  return {
    status: PermissionStatus.GRANTED,
    expires: 'never',
    granted: true,
    canAskAgain: true,
  };
}

/**
 * Check or request permissions to access the phone state.
 * This uses both `Cellular.requestPermissionsAsync` and `Cellular.getPermissionsAsync` to interact with the permissions.
 *
 * @example
 * ```ts
 * const [status, requestPermission] = Cellular.usePermissions();
 * ```
 */
export const usePermissions = createPermissionHook({
  getMethod: getPermissionsAsync,
  requestMethod: requestPermissionsAsync,
});

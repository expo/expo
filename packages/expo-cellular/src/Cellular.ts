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
 * Indicates if the carrier allows making VoIP calls on its network. On Android, this checks whether
 * the system supports SIP-based VoIP API. See [here](https://developer.android.com/reference/android/net/sip/SipManager.html#isVoipSupported(android.content.Context))
 * to view more information.
 *
 * On iOS, if you configure a device for a carrier and then remove the SIM card, this property
 * retains the `boolean` value indicating the carrier’s policy regarding VoIP. If you then install
 * a new SIM card, its VoIP policy `boolean` replaces the previous value of this property.
 *
 * On web, this returns `null`.
 *
 * @example
 * ```ts
 * Cellular.allowsVoip; // true or false
 * ```
 * @deprecated Use [`allowsVoipAsync()`](#allowsvoipasync) instead.
 *
 */
export const allowsVoip: boolean | null = ExpoCellular ? ExpoCellular.allowsVoip : null;

// @needsAudit
/**
 * The name of the user’s home cellular service provider. If the device has dual SIM cards, only the
 * carrier for the currently active SIM card will be returned. On Android, this value is only
 * available when the SIM state is [`SIM_STATE_READY`](https://developer.android.com/reference/android/telephony/TelephonyManager.html#SIM_STATE_READY).
 * Otherwise, this returns `null`.
 *
 * On iOS, if you configure a device for a carrier and then remove the SIM card, this property
 * retains the name of the carrier. If you then install a new SIM card, its carrier name replaces
 * the previous value of this property. The value for this property is `null` if the user never
 * configured a carrier for the device.
 *
 * On web, this returns `null`.
 *
 * @example
 * ```ts
 * Cellular.carrier; // "T-Mobile" or "Verizon"
 * ```
 * @deprecated Use [`getCarrierNameAsync()`](#getcarriernameasync) instead.
 *
 */
export const carrier: string | null = ExpoCellular ? ExpoCellular.carrier : null;

// @needsAudit
/**
 * The ISO country code for the user’s cellular service provider. On iOS, the value is `null` if any
 * of the following apply:
 * - The device is in airplane mode.
 * - There is no SIM card in the device.
 * - The device is outside of cellular service range.
 *
 * On web, this returns `null`.
 *
 * @example
 * ```ts
 * Cellular.isoCountryCode; // "us" or "au"
 * ```
 * @deprecated Use [`getIsoCountryCodeAsync()`](#getisocountrycodeAsync) instead.
 *
 */
export const isoCountryCode: string | null = ExpoCellular ? ExpoCellular.isoCountryCode : null;

// @needsAudit
/**
 * The mobile country code (MCC) for the user’s current registered cellular service provider.
 * On Android, this value is only available when SIM state is [`SIM_STATE_READY`](https://developer.android.com/reference/android/telephony/TelephonyManager.html#SIM_STATE_READY). Otherwise, this
 * returns `null`. On iOS, the value may be null on hardware prior to iPhone 4S when in airplane mode.
 * Furthermore, the value for this property is `null` if any of the following apply:
 * - There is no SIM card in the device.
 * - The device is outside of cellular service range.
 *
 * On web, this returns `null`.
 *
 * @example
 * ```ts
 * Cellular.mobileCountryCode; // "310"
 * ```
 * @deprecated Use [`getMobileCountryCodeAsync()`](#getmobilecountrycodeasync) instead.
 *
 */
export const mobileCountryCode: string | null = ExpoCellular
  ? ExpoCellular.mobileCountryCode
  : null;

// @needsAudit
/**
 * The ISO country code for the user’s cellular service provider. On iOS, the value is `null` if
 * any of the following apply:
 * - The device is in airplane mode.
 * - There is no SIM card in the device.
 * - The device is outside of cellular service range.
 *
 * On web, this returns `null`.
 *
 * @example
 * ```ts
 * Cellular.mobileNetworkCode; // "260"
 * ```
 * @deprecated Use [`getMobileNetworkCodeAsync()`](#getmobilenetworkcodeasync) instead.
 *
 */
export const mobileNetworkCode: string | null = ExpoCellular
  ? ExpoCellular.mobileNetworkCode
  : null;

// @needsAudit
/**
 * @return Returns a promise which fulfils with a [`Cellular.CellularGeneration`](#cellulargeneration)
 * enum value that represents the current cellular-generation type.
 * 
 * You will need to check if the native permission has been accepted to obtain generation. 
 * If the permission is denied `getCellularGenerationAsync` will resolve to `Cellular.Cellular Generation.UNKNOWN`.

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
 * On web, this returns `null`.
 *
 * @example
 * ```ts
 * await Cellular.allowsVoipAsync(); // true or false
 * ```
 */
export async function allowsVoipAsync(): Promise<boolean | null> {
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
 * On web, this returns `null`.
 *
 * @example
 * ```ts
 * await Cellular.getIsoCountryCodeAsync(); // "us" or "au"
 * ```
 *
 */
export async function getIsoCountryCodeAsync(): Promise<string | null> {
  if (!ExpoCellular.getIsoCountryCodeAsync) {
    throw new UnavailabilityError('expo-cellular', 'getIsoCountryCodeAsync');
  }
  return await ExpoCellular.getIsoCountryCodeAsync();
}

/**
 * @return Returns name of the user’s home cellular service provider. If the device has dual SIM cards, only the
 * carrier for the currently active SIM card will be returned.
 *
 * On Android, this value is only available when the SIM state is [`SIM_STATE_READY`](https://developer.android.com/reference/android/telephony/TelephonyManager.html#SIM_STATE_READY).
 * Otherwise, this returns `null`.
 *
 * On iOS, if you configure a device for a carrier and then remove the SIM card, this property
 * retains the name of the carrier. If you then install a new SIM card, its carrier name replaces
 * the previous value of this property. The value for this property is `null` if the user never
 * configured a carrier for the device.
 *
 * On web, this returns `null`.
 *
 * @example
 * ```ts
 * await Cellular.getCarrierNameAsync(); // "T-Mobile" or "Verizon"
 * ```
 */
export async function getCarrierNameAsync(): Promise<string | null> {
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
 * On web, this returns `null`.
 *
 * @example
 * ```ts
 * await Cellular.getMobileCountryCodeAsync(); // "310"
 * ```
 */
export async function getMobileCountryCodeAsync(): Promise<string | null> {
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
 * On web, this returns `null`.
 *
 * @example
 * ```ts
 * await Cellular.getMobileNetworkCodeAsync(); // "310"
 * ```
 */
export async function getMobileNetworkCodeAsync(): Promise<string | null> {
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

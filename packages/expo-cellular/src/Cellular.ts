import { UnavailabilityError } from '@unimodules/core';

import { CellularGeneration, CellularInfo } from './Cellular.types';
import ExpoCellular from './ExpoCellular';

export { CellularGeneration };

// @needsAudit
/**
 * @deprecated field, use `getCurrentCellularInfoAsync()` instead
 *
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
 * # Examples
 * ```ts
 * Cellular.allowsVoip; // true or false
 * ```
 */
export const allowsVoip: boolean | null = ExpoCellular ? ExpoCellular.allowsVoip : null;

// @needsAudit
/**
 * @deprecated field, use `getCurrentCellularInfoAsync()` instead
 *
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
 * # Examples
 * ```ts
 * Cellular.carrier; // "T-Mobile" or "Verizon"
 * ```
 */
export const carrier: string | null = ExpoCellular ? ExpoCellular.carrier : null;

// @needsAudit
/**
 * @deprecated field, use `getCurrentCellularInfoAsync()` instead
 *
 * The ISO country code for the user’s cellular service provider. On iOS, the value is `null` if any
 * of the following apply:
 * - The device is in airplane mode.
 * - There is no SIM card in the device.
 * - The device is outside of cellular service range.
 *
 * On web, this returns `null`.
 *
 * # Examples
 * ```ts
 * Cellular.isoCountryCode; // "us" or "au"
 * ```
 */
export const isoCountryCode: string | null = ExpoCellular ? ExpoCellular.isoCountryCode : null;

// @needsAudit
/**
 * @deprecated field, use `getCurrentCellularInfoAsync()` instead
 *
 * The mobile country code (MCC) for the user’s current registered cellular service provider.
 * On Android, this value is only available when SIM state is [`SIM_STATE_READY`](https://developer.android.com/reference/android/telephony/TelephonyManager.html#SIM_STATE_READY). Otherwise, this
 * returns `null`. On iOS, the value may be null on hardware prior to iPhone 4S when in airplane mode.
 * Furthermore, the value for this property is `null` if any of the following apply:
 * - There is no SIM card in the device.
 * - The device is outside of cellular service range.
 *
 * On web, this returns `null`.
 *
 * # Examples
 * ```ts
 * Cellular.mobileCountryCode; // "310"
 * ```
 */
export const mobileCountryCode: string | null = ExpoCellular
  ? ExpoCellular.mobileCountryCode
  : null;

// @needsAudit
/**
 * @deprecated field, use `getCurrentCellularInfoAsync()` instead
 *
 * The ISO country code for the user’s cellular service provider. On iOS, the value is `null` if
 * any of the following apply:
 * - The device is in airplane mode.
 * - There is no SIM card in the device.
 * - The device is outside of cellular service range.
 *
 * On web, this returns `null`.
 *
 * # Examples
 * ```ts
 * Cellular.mobileNetworkCode; // "260"
 * ```
 */
export const mobileNetworkCode: string | null = ExpoCellular
  ? ExpoCellular.mobileNetworkCode
  : null;

// @needsAudit
/**
 * @return Returns a promise which fulfils with a [`Cellular.CellularGeneration`](#cellulargeneration)
 * enum value that represents the current cellular-generation type.
 *
 * On web, this method uses [`navigator.connection.effectiveType`](https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/effectiveType)
 * to detect the effective type of the connection using a combination of recently observed
 * round-trip time and downlink values. See [here](https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API)
 * to view browser compatibility.
 *
 * # Example
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
 * Gets information about the device's current cellular connection. The return value of this method
 * changes if the device changes carriers, such as when swapping the SIM card or roaming.
 *
 * On Android, this method needs permission granted from
 * [`requestPhoneStatePermissionsAsync`](#requestPhoneStatePermissionsAsync) to read information
 * about the cellular connection.
 *
 * This method should be used in favor of this module's constants because the cellular connection
 * may change during the lifetime of the app.
 *
 * @returns A promise that fulfills with a [`Cellular.CellularInfo`](#cellularinfo) object with
 * information about the device's cellular connection.
 */
export async function getCurrentCellularInfoAsync(): Promise<CellularInfo> {
  if (!ExpoCellular.getCurrentCellularInfoAsync) {
    throw new UnavailabilityError('expo-cellular', 'getCurrentCellularInfoAsync');
  }
  return await ExpoCellular.getCurrentCellularInfoAsync();
}

import { UnavailabilityError } from '@unimodules/core';
import { CellularGeneration } from './Cellular.types';
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
 * # Examples
 * ```ts
 * Cellular.allowsVoip; // true or false
 * ```
 */
export const allowsVoip = ExpoCellular ? ExpoCellular.allowsVoip : null;
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
 * # Examples
 * ```ts
 * Cellular.carrier; // "T-Mobile" or "Verizon"
 * ```
 */
export const carrier = ExpoCellular ? ExpoCellular.carrier : null;
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
 * # Examples
 * ```ts
 * Cellular.isoCountryCode; // "us" or "au"
 * ```
 */
export const isoCountryCode = ExpoCellular ? ExpoCellular.isoCountryCode : null;
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
 * # Examples
 * ```ts
 * Cellular.mobileCountryCode; // "310"
 * ```
 */
export const mobileCountryCode = ExpoCellular
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
 * # Examples
 * ```ts
 * Cellular.mobileNetworkCode; // "260"
 * ```
 */
export const mobileNetworkCode = ExpoCellular
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
export async function getCellularGenerationAsync() {
    if (!ExpoCellular.getCellularGenerationAsync) {
        throw new UnavailabilityError('expo-cellular', 'getCellularGenerationAsync');
    }
    return await ExpoCellular.getCellularGenerationAsync();
}
//# sourceMappingURL=Cellular.js.map
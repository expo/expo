import { CellularGeneration, PermissionResponse } from './Cellular.types';
export { CellularGeneration };
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
export declare function getCellularGenerationAsync(): Promise<CellularGeneration>;
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
export declare function allowsVoipAsync(): Promise<boolean | null>;
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
export declare function getIsoCountryCodeAsync(): Promise<string | null>;
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
export declare function getCarrierNameAsync(): Promise<string | null>;
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
export declare function getMobileCountryCodeAsync(): Promise<string | null>;
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
export declare function getMobileNetworkCodeAsync(): Promise<string | null>;
/**
 * Checks user's permissions for accessing phone state.
 */
export declare function getPermissionsAsync(): Promise<PermissionResponse>;
/**
 * Asks the user to grant permissions for accessing the phone state.
 */
export declare function requestPermissionsAsync(): Promise<PermissionResponse>;
/**
 * Check or request permissions to access the phone state.
 * This uses both `Cellular.requestPermissionsAsync` and `Cellular.getPermissionsAsync` to interact with the permissions.
 *
 * @example
 * ```ts
 * const [status, requestPermission] = Cellular.usePermissions();
 * ```
 */
export declare const usePermissions: (options?: import("expo-modules-core").PermissionHookOptions<object> | undefined) => [PermissionResponse | null, () => Promise<PermissionResponse>, () => Promise<PermissionResponse>];
//# sourceMappingURL=Cellular.d.ts.map
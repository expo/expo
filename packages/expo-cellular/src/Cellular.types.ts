// @needsAudit
/**
 * Describes the current generation of the cellular connection. It is an enum with these possible
 * values:
 */
export enum CellularGeneration {
  /**
   * Either we are not currently connected to a cellular network or type could not be determined.
   */
  UNKNOWN = 0,
  /**
   * Currently connected to a 2G cellular network. Includes CDMA, EDGE, GPRS, and IDEN type connections.
   */
  CELLULAR_2G = 1,
  /**
   * Currently connected to a 3G cellular network. Includes EHRPD, EVDO, HSPA, HSUPA, HSDPA, and UTMS type connections.
   */
  CELLULAR_3G = 2,
  /**
   * Currently connected to a 4G cellular network. Includes HSPAP and LTE type connections.
   */
  CELLULAR_4G = 3,
  /**
   * Currently connected to a 5G cellular network. Includes NR and NRNSA type connections.
   */
  CELLULAR_5G = 4,
}

export type CellularInfo = {
  /**
   * Indicates if the carrier allows making VoIP calls on its network. On Android, this checks whether
   * the system supports SIP-based VoIP API. See [here](https://developer.android.com/reference/android/net/sip/SipManager.html#isVoipSupported(android.content.Context))
   * to view more information.
   *
   * On iOS, if you configure a device for a carrier and then remove the SIM card, this property
   * retains the `boolean` value indicating the carrier’s policy regarding VoIP. If you then install
   * a new SIM card, its VoIP policy `boolean` replaces the previous value of this property.
   *
   * On web, this field is `null`.
   */
  allowsVoip: boolean | null;
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
   * On web, this field is `null`.
   */
  carrier: string | null;
  /**
   * The ISO country code for the user’s cellular service provider. On iOS, the value is `null` if any
   * of the following apply:
   * - The device is in airplane mode.
   * - There is no SIM card in the device.
   * - The device is outside of cellular service range.
   *
   * On web, this field is `null`.
   */
  isoCountryCode: string | null;
  /**
   * The mobile country code (MCC) for the user’s current registered cellular service provider.
   * On Android, this value is only available when SIM state is [`SIM_STATE_READY`](https://developer.android.com/reference/android/telephony/TelephonyManager.html#SIM_STATE_READY). Otherwise, this
   * returns `null`. On iOS, the value may be null on hardware prior to iPhone 4S when in airplane mode.
   * Furthermore, the value for this property is `null` if any of the following apply:
   * - There is no SIM card in the device.
   * - The device is outside of cellular service range.
   *
   * On web, this field is `null`.
   */
  mobileCountryCode: string | null;
  /**
   * The ISO country code for the user’s cellular service provider. On iOS, the value is `null` if
   * any of the following apply:
   * - The device is in airplane mode.
   * - There is no SIM card in the device.
   * - The device is outside of cellular service range.
   *
   * On web, this field is `null`.
   */
  mobileNetworkCode: string | null;
  /**
   * Describes the current generation of the cellular connection. It's possible values
   * are described by [CellularGeneration](#cellulargeneration) 
   */
  generation: CellularGeneration;
};

// https://android.googlesource.com/platform/external/bluetooth/bluedroid/+/lollipop-release/stack/include/gatt_api.h
// http://dev.ti.com/tirex/content/simplelink_cc2640r2_sdk_1_35_00_33/docs/blestack/ble_sw_dev_guide/doxygen/group___a_t_t___e_r_r___c_o_d_e___d_e_f_i_n_e_s.html

/**
 * A lot of GATT status codes aren't documented by Google, or the various device vendors.
 * The error messages used here may not align exactly with the error, but they seem more helpful than not.
 * If you dig through low-level BLE you could probably find the codes for your exact device.
 *
 * https://android.googlesource.com/platform/external/bluetooth/bluedroid/+/lollipop-release/stack/include/gatt_api.h
 * https://android.googlesource.com/platform/external/bluetooth/bluedroid/+/lollipop-release/stack/include/l2cdefs.h
 * https://android.googlesource.com/platform/external/libnfc-nci/+/lollipop-release/src/include/hcidefs.h
 *
 * 0xE0-0xFC are reserved:
 * https://android.googlesource.com/platform/external/bluetooth/bluedroid/+/lollipop-release/stack/include/gatt_api.h
 */
enum GATTStatusCode {
  /** Operation was successful */
  Success = 0x00,
  /** Attribute handle value given was not valid on this attribute server. */
  InvalidHandle = 0x01,
  /** Attribute cannot be read. */
  ReadNotPermit = 0x02,
  /** Attribute cannot be written. */
  WriteNotPermit = 0x03,
  /** The attribute PDU was invalid. */
  InvalidPDU = 0x04,
  /** The attribute requires authentication before it can be read or written. */
  InsufficientAuthentication = 0x05,
  /** Attribute server doesn't support the request received from the attribute client.  */
  RequestNotSupported = 0x06,
  /** Offset specified was past the end of the attribute. */
  InvalidOffset = 0x07,
  /** The attribute requires an authorization before it can be read or written. */
  InsufficientAuthorization = 0x08,
  /** Too many prepare writes have been queued. */
  PrepareQueueFull = 0x09,
  /** No attribute found within the given attribute handle range. */
  NotFound = 0x0a,
  /** Attribute cannot be read or written using the Read Blob Request or Prepare Write Request. */
  NotLong = 0x0b,
  /** The Encryption Key Size used for encrypting this link is insufficient. */
  InsufficientKeySize = 0x0c,
  /** The attribute value length is invalid for the operation. */
  InvalidAttrLength = 0x0d,
  /** The attribute request that was requested has encountered an error that was very unlikely, and therefore could not be completed as requested. */
  ErrorUnlikely = 0x0e,
  /** The attribute requires encryption before it can be read or written. */
  InsufficientEncryption = 0x0f,
  /** The attribute type is not a supported grouping attribute as defined by a higher layer specification. */
  UnsupportGRPType = 0x10,
  /** Insufficient Resources to complete the request. */
  InsufficientResource = 0x11,
  /** The attribute value is invalid for the operation.  */
  NoResources = 0x80, //ATT_ERR_INVALID_VALUE

  // Not in TI?

  // EncrypedMitm =                  0x00,

  /** Illegal parameter was used in a GATT operation. */
  IllegalParameter = 0x87,
  /** Internal error occurred in the Android BLE API */
  InternalError = 0x81,
  /** An illegal state is being used. */
  WrongState = 0x82,
  /** Insufficient internal memory for BLE buffer cache. */
  DatabaseFull = 0x83,
  /** The maximum number of operations has been exceeded. */
  Busy = 0x84,
  /** An unknown error has occurred. */
  Error = 0x85,
  /** Command is already queued up in GATT. */
  CommandStarted = 0x86,
  /** Operation is pending. */
  Pending = 0x88,
  /** Authorization failed before performing read or write operation. */
  AuthorizationFailed = 0x89,
  /** More cache entries were loaded then expected. */
  More = 0x8a,
  /** Invalid configuration */
  InvalidConfiguration = 0x8b,
  /** The GATT service already started. */
  ServiceStarted = 0x8c,
  /** GATT link is encrypted but still vulnerable to man in the middle attacks. */
  EncrypedNoMITM = 0x8d,
  /** Link to GATT is not encrypted. */
  NotEncrypted = 0x8e,
  /** Attribute command could not be processed while the channel is full. */
  Congested = 0x8f,

  ///* 0xE0 ~ 0xFC reserved for future use */

  /** Client Characteristic Configuration Descriptor Improperly Configured */
  CCC_CFG_Error = 0xfd,
  /** Procedure Already in progress */
  PRCInProgress = 0xfe,
  /** Attribute value out of range */
  OutOfRange = 0xff,
}

export default GATTStatusCode;

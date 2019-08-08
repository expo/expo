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
var GATTStatusCode;
(function (GATTStatusCode) {
    /** Operation was successful */
    GATTStatusCode[GATTStatusCode["Success"] = 0] = "Success";
    /** Attribute handle value given was not valid on this attribute server. */
    GATTStatusCode[GATTStatusCode["InvalidHandle"] = 1] = "InvalidHandle";
    /** Attribute cannot be read. */
    GATTStatusCode[GATTStatusCode["ReadNotPermit"] = 2] = "ReadNotPermit";
    /** Attribute cannot be written. */
    GATTStatusCode[GATTStatusCode["WriteNotPermit"] = 3] = "WriteNotPermit";
    /** The attribute PDU was invalid. */
    GATTStatusCode[GATTStatusCode["InvalidPDU"] = 4] = "InvalidPDU";
    /** The attribute requires authentication before it can be read or written. */
    GATTStatusCode[GATTStatusCode["InsufficientAuthentication"] = 5] = "InsufficientAuthentication";
    /** Attribute server doesn't support the request received from the attribute client.  */
    GATTStatusCode[GATTStatusCode["RequestNotSupported"] = 6] = "RequestNotSupported";
    /** Offset specified was past the end of the attribute. */
    GATTStatusCode[GATTStatusCode["InvalidOffset"] = 7] = "InvalidOffset";
    /** The attribute requires an authorization before it can be read or written. */
    GATTStatusCode[GATTStatusCode["InsufficientAuthorization"] = 8] = "InsufficientAuthorization";
    /** Too many prepare writes have been queued. */
    GATTStatusCode[GATTStatusCode["PrepareQueueFull"] = 9] = "PrepareQueueFull";
    /** No attribute found within the given attribute handle range. */
    GATTStatusCode[GATTStatusCode["NotFound"] = 10] = "NotFound";
    /** Attribute cannot be read or written using the Read Blob Request or Prepare Write Request. */
    GATTStatusCode[GATTStatusCode["NotLong"] = 11] = "NotLong";
    /** The Encryption Key Size used for encrypting this link is insufficient. */
    GATTStatusCode[GATTStatusCode["InsufficientKeySize"] = 12] = "InsufficientKeySize";
    /** The attribute value length is invalid for the operation. */
    GATTStatusCode[GATTStatusCode["InvalidAttrLength"] = 13] = "InvalidAttrLength";
    /** The attribute request that was requested has encountered an error that was very unlikely, and therefore could not be completed as requested. */
    GATTStatusCode[GATTStatusCode["ErrorUnlikely"] = 14] = "ErrorUnlikely";
    /** The attribute requires encryption before it can be read or written. */
    GATTStatusCode[GATTStatusCode["InsufficientEncryption"] = 15] = "InsufficientEncryption";
    /** The attribute type is not a supported grouping attribute as defined by a higher layer specification. */
    GATTStatusCode[GATTStatusCode["UnsupportGRPType"] = 16] = "UnsupportGRPType";
    /** Insufficient Resources to complete the request. */
    GATTStatusCode[GATTStatusCode["InsufficientResource"] = 17] = "InsufficientResource";
    /** The attribute value is invalid for the operation.  */
    GATTStatusCode[GATTStatusCode["NoResources"] = 128] = "NoResources";
    // Not in TI?
    // EncrypedMitm =                  0x00,
    /** Illegal parameter was used in a GATT operation. */
    GATTStatusCode[GATTStatusCode["IllegalParameter"] = 135] = "IllegalParameter";
    /** Internal error occurred in the Android BLE API */
    GATTStatusCode[GATTStatusCode["InternalError"] = 129] = "InternalError";
    /** An illegal state is being used. */
    GATTStatusCode[GATTStatusCode["WrongState"] = 130] = "WrongState";
    /** Insufficient internal memory for BLE buffer cache. */
    GATTStatusCode[GATTStatusCode["DatabaseFull"] = 131] = "DatabaseFull";
    /** The maximum number of operations has been exceeded. */
    GATTStatusCode[GATTStatusCode["Busy"] = 132] = "Busy";
    /** An unknown error has occurred. */
    GATTStatusCode[GATTStatusCode["Error"] = 133] = "Error";
    /** Command is already queued up in GATT. */
    GATTStatusCode[GATTStatusCode["CommandStarted"] = 134] = "CommandStarted";
    /** Operation is pending. */
    GATTStatusCode[GATTStatusCode["Pending"] = 136] = "Pending";
    /** Authorization failed before performing read or write operation. */
    GATTStatusCode[GATTStatusCode["AuthorizationFailed"] = 137] = "AuthorizationFailed";
    /** More cache entries were loaded then expected. */
    GATTStatusCode[GATTStatusCode["More"] = 138] = "More";
    /** Invalid configuration */
    GATTStatusCode[GATTStatusCode["InvalidConfiguration"] = 139] = "InvalidConfiguration";
    /** The GATT service already started. */
    GATTStatusCode[GATTStatusCode["ServiceStarted"] = 140] = "ServiceStarted";
    /** GATT link is encrypted but still vulnerable to man in the middle attacks. */
    GATTStatusCode[GATTStatusCode["EncrypedNoMITM"] = 141] = "EncrypedNoMITM";
    /** Link to GATT is not encrypted. */
    GATTStatusCode[GATTStatusCode["NotEncrypted"] = 142] = "NotEncrypted";
    /** Attribute command could not be processed while the channel is full. */
    GATTStatusCode[GATTStatusCode["Congested"] = 143] = "Congested";
    ///* 0xE0 ~ 0xFC reserved for future use */
    /** Client Characteristic Configuration Descriptor Improperly Configured */
    GATTStatusCode[GATTStatusCode["CCC_CFG_Error"] = 253] = "CCC_CFG_Error";
    /** Procedure Already in progress */
    GATTStatusCode[GATTStatusCode["PRCInProgress"] = 254] = "PRCInProgress";
    /** Attribute value out of range */
    GATTStatusCode[GATTStatusCode["OutOfRange"] = 255] = "OutOfRange";
})(GATTStatusCode || (GATTStatusCode = {}));
export default GATTStatusCode;
//# sourceMappingURL=GATTStatusCode.js.map
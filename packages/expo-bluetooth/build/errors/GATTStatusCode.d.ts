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
declare enum GATTStatusCode {
    /** Operation was successful */
    Success = 0,
    /** Attribute handle value given was not valid on this attribute server. */
    InvalidHandle = 1,
    /** Attribute cannot be read. */
    ReadNotPermit = 2,
    /** Attribute cannot be written. */
    WriteNotPermit = 3,
    /** The attribute PDU was invalid. */
    InvalidPDU = 4,
    /** The attribute requires authentication before it can be read or written. */
    InsufficientAuthentication = 5,
    /** Attribute server doesn't support the request received from the attribute client.  */
    RequestNotSupported = 6,
    /** Offset specified was past the end of the attribute. */
    InvalidOffset = 7,
    /** The attribute requires an authorization before it can be read or written. */
    InsufficientAuthorization = 8,
    /** Too many prepare writes have been queued. */
    PrepareQueueFull = 9,
    /** No attribute found within the given attribute handle range. */
    NotFound = 10,
    /** Attribute cannot be read or written using the Read Blob Request or Prepare Write Request. */
    NotLong = 11,
    /** The Encryption Key Size used for encrypting this link is insufficient. */
    InsufficientKeySize = 12,
    /** The attribute value length is invalid for the operation. */
    InvalidAttrLength = 13,
    /** The attribute request that was requested has encountered an error that was very unlikely, and therefore could not be completed as requested. */
    ErrorUnlikely = 14,
    /** The attribute requires encryption before it can be read or written. */
    InsufficientEncryption = 15,
    /** The attribute type is not a supported grouping attribute as defined by a higher layer specification. */
    UnsupportGRPType = 16,
    /** Insufficient Resources to complete the request. */
    InsufficientResource = 17,
    /** The attribute value is invalid for the operation.  */
    NoResources = 128,
    /** Illegal parameter was used in a GATT operation. */
    IllegalParameter = 135,
    /** Internal error occurred in the Android BLE API */
    InternalError = 129,
    /** An illegal state is being used. */
    WrongState = 130,
    /** Insufficient internal memory for BLE buffer cache. */
    DatabaseFull = 131,
    /** The maximum number of operations has been exceeded. */
    Busy = 132,
    /** An unknown error has occurred. */
    Error = 133,
    /** Command is already queued up in GATT. */
    CommandStarted = 134,
    /** Operation is pending. */
    Pending = 136,
    /** Authorization failed before performing read or write operation. */
    AuthorizationFailed = 137,
    /** More cache entries were loaded then expected. */
    More = 138,
    /** Invalid configuration */
    InvalidConfiguration = 139,
    /** The GATT service already started. */
    ServiceStarted = 140,
    /** GATT link is encrypted but still vulnerable to man in the middle attacks. */
    EncrypedNoMITM = 141,
    /** Link to GATT is not encrypted. */
    NotEncrypted = 142,
    /** Attribute command could not be processed while the channel is full. */
    Congested = 143,
    /** Client Characteristic Configuration Descriptor Improperly Configured */
    CCC_CFG_Error = 253,
    /** Procedure Already in progress */
    PRCInProgress = 254,
    /** Attribute value out of range */
    OutOfRange = 255
}
export default GATTStatusCode;

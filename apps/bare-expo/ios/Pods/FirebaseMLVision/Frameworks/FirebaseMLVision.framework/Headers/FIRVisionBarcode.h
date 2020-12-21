#import <CoreGraphics/CoreGraphics.h>
#import <Foundation/Foundation.h>

#import "FIRVisionBarcodeDetectorOptions.h"

NS_ASSUME_NONNULL_BEGIN

/**
 * @enum VisionBarcodeValueType
 * Barcode's value format. For example, TEXT, PRODUCT, URL, etc.
 */
typedef NS_ENUM(NSInteger, FIRVisionBarcodeValueType) {
  /** Unknown Barcode value types.  */
  FIRVisionBarcodeValueTypeUnknown,
  /** Barcode value type for contact info. */
  FIRVisionBarcodeValueTypeContactInfo,
  /** Barcode value type for email addresses. */
  FIRVisionBarcodeValueTypeEmail,
  /** Barcode value type for ISBNs. */
  FIRVisionBarcodeValueTypeISBN,
  /** Barcode value type for phone numbers. */
  FIRVisionBarcodeValueTypePhone,
  /** Barcode value type for product codes. */
  FIRVisionBarcodeValueTypeProduct,
  /** Barcode value type for SMS details. */
  FIRVisionBarcodeValueTypeSMS,
  /** Barcode value type for plain text. */
  FIRVisionBarcodeValueTypeText,
  /** Barcode value type for URLs/bookmarks. */
  FIRVisionBarcodeValueTypeURL,
  /** Barcode value type for Wi-Fi access point details. */
  FIRVisionBarcodeValueTypeWiFi,
  /** Barcode value type for geographic coordinates. */
  FIRVisionBarcodeValueTypeGeographicCoordinates,
  /** Barcode value type for calendar events. */
  FIRVisionBarcodeValueTypeCalendarEvent,
  /** Barcode value type for driver's license data. */
  FIRVisionBarcodeValueTypeDriversLicense,
} NS_SWIFT_NAME(VisionBarcodeValueType);

/**
 * @enum VisionBarcodeAddressType
 * Address type.
 */
typedef NS_ENUM(NSInteger, FIRVisionBarcodeAddressType) {
  /** Barcode unknown address type. */
  FIRVisionBarcodeAddressTypeUnknown,
  /** Barcode work address type. */
  FIRVisionBarcodeAddressTypeWork,
  /** Barcode home address type. */
  FIRVisionBarcodeAddressTypeHome,
} NS_SWIFT_NAME(VisionBarcodeAddressType);

/**
 * @enum VisionBarcodeEmailType
 * Email type for VisionBarcodeEmail.
 */
typedef NS_ENUM(NSInteger, FIRVisionBarcodeEmailType) {
  /** Unknown email type. */
  FIRVisionBarcodeEmailTypeUnknown,
  /** Barcode work email type. */
  FIRVisionBarcodeEmailTypeWork,
  /** Barcode home email type. */
  FIRVisionBarcodeEmailTypeHome,
} NS_SWIFT_NAME(VisionBarcodeEmailType);

/**
 * @enum VisionBarcodePhoneType
 * Phone type for VisionBarcodePhone.
 */
typedef NS_ENUM(NSInteger, FIRVisionBarcodePhoneType) {
  /** Unknown phone type. */
  FIRVisionBarcodePhoneTypeUnknown,
  /** Barcode work phone type. */
  FIRVisionBarcodePhoneTypeWork,
  /** Barcode home phone type. */
  FIRVisionBarcodePhoneTypeHome,
  /** Barcode fax phone type. */
  FIRVisionBarcodePhoneTypeFax,
  /** Barcode mobile phone type. */
  FIRVisionBarcodePhoneTypeMobile,
} NS_SWIFT_NAME(VisionBarcodePhoneType);

/**
 * @enum VisionBarcodeWiFiEncryptionType
 * Wi-Fi encryption type for VisionBarcodeWiFi.
 */
typedef NS_ENUM(NSInteger, FIRVisionBarcodeWiFiEncryptionType) {
  /** Barcode unknown Wi-Fi encryption type. */
  FIRVisionBarcodeWiFiEncryptionTypeUnknown,
  /** Barcode open Wi-Fi encryption type. */
  FIRVisionBarcodeWiFiEncryptionTypeOpen,
  /** Barcode WPA Wi-Fi encryption type. */
  FIRVisionBarcodeWiFiEncryptionTypeWPA,
  /** Barcode WEP Wi-Fi encryption type. */
  FIRVisionBarcodeWiFiEncryptionTypeWEP,
} NS_SWIFT_NAME(VisionBarcodeWiFiEncryptionType);

/** An address. */
NS_SWIFT_NAME(VisionBarcodeAddress)
@interface FIRVisionBarcodeAddress : NSObject

/**
 * Formatted address, containing multiple lines when appropriate.
 *
 * The parsing of address formats is quite limited. Typically all address information will appear
 * on the first address line. To handle addresses better, it is recommended to parse the raw data.
 * The raw data is available in `FIRVisionBarcode`'s `rawValue` property.
 */
@property(nonatomic, readonly, nullable) NSArray<NSString *> *addressLines;

/** Address type. */
@property(nonatomic, readonly) FIRVisionBarcodeAddressType type;

/** Unavailable. */
- (instancetype)init NS_UNAVAILABLE;

@end

/** A calendar event extracted from a QR code. */
NS_SWIFT_NAME(VisionBarcodeCalendarEvent)
@interface FIRVisionBarcodeCalendarEvent : NSObject

/** Calendar event description. */
@property(nonatomic, readonly, nullable) NSString *eventDescription;

/** Calendar event location. */
@property(nonatomic, readonly, nullable) NSString *location;

/** Clendar event organizer. */
@property(nonatomic, readonly, nullable) NSString *organizer;

/** Calendar event status. */
@property(nonatomic, readonly, nullable) NSString *status;

/** Calendar event summary. */
@property(nonatomic, readonly, nullable) NSString *summary;

/** Calendar event start date. */
@property(nonatomic, readonly, nullable) NSDate *start;

/** Calendar event end date. */
@property(nonatomic, readonly, nullable) NSDate *end;

/** Unavailable. */
- (instancetype)init NS_UNAVAILABLE;

@end

/**
 * A driver license or ID card data representation.
 *
 * An ANSI driver license contains more fields than are represented by this class. The
 * `FIRVisionBarcode`s `rawValue` property can be used to access the other fields.
 */
NS_SWIFT_NAME(VisionBarcodeDriverLicense)
@interface FIRVisionBarcodeDriverLicense : NSObject

/** Holder's first name. */
@property(nonatomic, readonly, nullable) NSString *firstName;

/** Holder's middle name. */
@property(nonatomic, readonly, nullable) NSString *middleName;

/** Holder's last name. */
@property(nonatomic, readonly, nullable) NSString *lastName;

/** Holder's gender. 1 is male and 2 is female. */
@property(nonatomic, readonly, nullable) NSString *gender;

/** Holder's city address. */
@property(nonatomic, readonly, nullable) NSString *addressCity;

/** Holder's state address. */
@property(nonatomic, readonly, nullable) NSString *addressState;

/** Holder's street address. */
@property(nonatomic, readonly, nullable) NSString *addressStreet;

/** Holder's address' zipcode. */
@property(nonatomic, readonly, nullable) NSString *addressZip;

/** Holder's birthday. The date format depends on the issuing country. */
@property(nonatomic, readonly, nullable) NSString *birthDate;

/** "DL" for driver licenses, "ID" for ID cards. */
@property(nonatomic, readonly, nullable) NSString *documentType;

/** Driver license ID number. */
@property(nonatomic, readonly, nullable) NSString *licenseNumber;

/** Driver license expiration date. The date format depends on the issuing country. */
@property(nonatomic, readonly, nullable) NSString *expiryDate;

/** The date format depends on the issuing country. */
@property(nonatomic, readonly, nullable) NSString *issuingDate;

/** A country in which DL/ID was issued. */
@property(nonatomic, readonly, nullable) NSString *issuingCountry;

/** Unavailable. */
- (instancetype)init NS_UNAVAILABLE;

@end

/** An email message from a 'MAILTO:' or similar QR Code type. */
NS_SWIFT_NAME(VisionBarcodeEmail)
@interface FIRVisionBarcodeEmail : NSObject

/** Email message address. */
@property(nonatomic, readonly, nullable) NSString *address;

/** Email message body. */
@property(nonatomic, readonly, nullable) NSString *body;

/** Email message subject. */
@property(nonatomic, readonly, nullable) NSString *subject;

/** Email message type. */
@property(nonatomic, readonly) FIRVisionBarcodeEmailType type;

/** Unavailable. */
- (instancetype)init NS_UNAVAILABLE;

@end

/** GPS coordinates from a 'GEO:' or similar QR Code type data. */
NS_SWIFT_NAME(VisionBarcodeGeoPoint)
@interface FIRVisionBarcodeGeoPoint : NSObject
/** A location latitude. */
@property(nonatomic, readonly) double latitude;

/** A location longitude. */
@property(nonatomic, readonly) double longitude;

/** Unavailable. */
- (instancetype)init NS_UNAVAILABLE;

@end

/** A person's name, both formatted and as individual name components. */
NS_SWIFT_NAME(VisionBarcodePersonName)
@interface FIRVisionBarcodePersonName : NSObject

/** Properly formatted name. */
@property(nonatomic, readonly, nullable) NSString *formattedName;

/** First name. */
@property(nonatomic, readonly, nullable) NSString *first;

/** Last name. */
@property(nonatomic, readonly, nullable) NSString *last;

/** Middle name. */
@property(nonatomic, readonly, nullable) NSString *middle;

/** Name prefix. */
@property(nonatomic, readonly, nullable) NSString *prefix;

/**
 * Designates a text string to be set as the kana name in the phonebook.
 * Used for Japanese contacts.
 */
@property(nonatomic, readonly, nullable) NSString *pronounciation;

/** Name suffix. */
@property(nonatomic, readonly, nullable) NSString *suffix;

/** Unavailable. */
- (instancetype)init NS_UNAVAILABLE;

@end

/** A phone number from a 'TEL:' or similar QR Code type. */
NS_SWIFT_NAME(VisionBarcodePhone)
@interface FIRVisionBarcodePhone : NSObject

/** Phone number. */
@property(nonatomic, readonly, nullable) NSString *number;

/** Phone number type. */
@property(nonatomic, readonly) FIRVisionBarcodePhoneType type;

/** Unavailable. */
- (instancetype)init NS_UNAVAILABLE;

@end

/** An SMS message from an 'SMS:' or similar QR Code type. */
NS_SWIFT_NAME(VisionBarcodeSMS)
@interface FIRVisionBarcodeSMS : NSObject

/** An SMS message body. */
@property(nonatomic, readonly, nullable) NSString *message;

/** An SMS message phone number. */
@property(nonatomic, readonly, nullable) NSString *phoneNumber;

/** Unavailable. */
- (instancetype)init NS_UNAVAILABLE;

@end

/** A URL and title from a 'MEBKM:' or similar QR Code type. */
NS_SWIFT_NAME(VisionBarcodeURLBookmark)
@interface FIRVisionBarcodeURLBookmark : NSObject

/** A URL bookmark title. */
@property(nonatomic, readonly, nullable) NSString *title;

/** A URL bookmark url. */
@property(nonatomic, readonly, nullable) NSString *url;

/** Unavailable. */
- (instancetype)init NS_UNAVAILABLE;

@end

/** Wi-Fi network parameters from a 'WIFI:' or similar QR Code type. */
NS_SWIFT_NAME(VisionBarcodeWifi)
@interface FIRVisionBarcodeWiFi : NSObject

/** A Wi-Fi access point SSID. */
@property(nonatomic, readonly, nullable) NSString *ssid;

/** A Wi-Fi access point password. */
@property(nonatomic, readonly, nullable) NSString *password;

/** A Wi-Fi access point encryption type. */
@property(nonatomic, readonly) FIRVisionBarcodeWiFiEncryptionType type;

/** Unavailable. */
- (instancetype)init NS_UNAVAILABLE;

@end

/**
 * A person's or organization's business card. This may come from different underlying formats
 * including VCARD and MECARD.
 *
 * This object represents a simplified view of possible business cards. If you require lossless
 * access to the information in the barcode, you should parse the raw data yourself. To access the
 * raw data, use the `FIRVisionBarcode`s `rawValue` property.
 */
NS_SWIFT_NAME(VisionBarcodeContactInfo)
@interface FIRVisionBarcodeContactInfo : NSObject

/** Person's or organization's addresses. */
@property(nonatomic, readonly, nullable) NSArray<FIRVisionBarcodeAddress *> *addresses;

/** Contact emails. */
@property(nonatomic, readonly, nullable) NSArray<FIRVisionBarcodeEmail *> *emails;

/** A person's name. */
@property(nonatomic, readonly, nullable) FIRVisionBarcodePersonName *name;

/** Contact phone numbers. */
@property(nonatomic, readonly, nullable) NSArray<FIRVisionBarcodePhone *> *phones;

/** Contact URLs. */
@property(nonatomic, readonly, nullable) NSArray<NSString *> *urls;

/** A job title. */
@property(nonatomic, readonly, nullable) NSString *jobTitle;

/** A business organization. */
@property(nonatomic, readonly, nullable) NSString *organization;

/** Unavailable. */
- (instancetype)init NS_UNAVAILABLE;

@end

/** A barcode in an image. */
NS_SWIFT_NAME(VisionBarcode)
@interface FIRVisionBarcode : NSObject

/**
 * The rectangle that holds the discovered relative to the detected image in the view
 * coordinate system.
 */
@property(nonatomic, readonly) CGRect frame;

/**
 * A barcode value as it was encoded in the barcode. Structured values are not parsed, for example:
 * 'MEBKM:TITLE:Google;URL:https://www.google.com;;'. Does not include the supplemental value.
 */
@property(nonatomic, readonly, nullable) NSString *rawValue;

/** Raw data stored in barcode. */
@property(nonatomic, readonly, nullable) NSData *rawData;

/**
 * A barcode value in a user-friendly format. May omit some of the information encoded in the
 * barcode. For example, in the case above the display value might be 'https://www.google.com'.
 * If valueType == .text, this field will be equal to rawValue. This value may be multiline,
 * for example, when line breaks are encoded into the original TEXT barcode value. May include
 * the supplement value.
 */
@property(nonatomic, readonly, nullable) NSString *displayValue;

/**
 * A barcode format; for example, EAN_13. Note that if the format is not in the list,
 * VisionBarcodeFormat.unknown would be returned.
 */
@property(nonatomic, readonly) FIRVisionBarcodeFormat format;

/**
 * The four corner points of the barcode, in clockwise order starting with the top left relative
 * to the detected image in the view coordinate system. These are CGPoints boxed in NSValues.
 * Due to the possible perspective distortions, this is not necessarily a rectangle.
 */
@property(nonatomic, readonly, nullable) NSArray<NSValue *> *cornerPoints;

/**
 * A type of the barcode value. For example, TEXT, PRODUCT, URL, etc. Note that if the type is not
 * in the list, .unknown would be returned.
 */
@property(nonatomic, readonly) FIRVisionBarcodeValueType valueType;

/**
 * An email message from a 'MAILTO:' or similar QR Code type. This property is only set if
 * valueType is .email.
 */
@property(nonatomic, readonly, nullable) FIRVisionBarcodeEmail *email;

/**
 * A phone number from a 'TEL:' or similar QR Code type. This property is only set if valueType
 * is .phone.
 */
@property(nonatomic, readonly, nullable) FIRVisionBarcodePhone *phone;

/**
 * An SMS message from an 'SMS:' or similar QR Code type. This property is only set if valueType
 * is .sms.
 */
@property(nonatomic, readonly, nullable) FIRVisionBarcodeSMS *sms;

/**
 * A URL and title from a 'MEBKM:' or similar QR Code type. This property is only set if
 * valueType is .url.
 */
@property(nonatomic, readonly, nullable) FIRVisionBarcodeURLBookmark *URL;

/**
 * Wi-Fi network parameters from a 'WIFI:' or similar QR Code type. This property is only set
 * if valueType is .wifi.
 */
@property(nonatomic, readonly, nullable) FIRVisionBarcodeWiFi *wifi;

/**
 * GPS coordinates from a 'GEO:' or similar QR Code type. This property is only set if valueType
 * is .geo.
 */
@property(nonatomic, readonly, nullable) FIRVisionBarcodeGeoPoint *geoPoint;

/**
 * A person's or organization's business card. For example a VCARD. This property is only set
 * if valueType is .contactInfo.
 */
@property(nonatomic, readonly, nullable) FIRVisionBarcodeContactInfo *contactInfo;

/**
 * A calendar event extracted from a QR Code. This property is only set if valueType is
 * .calendarEvent.
 */
@property(nonatomic, readonly, nullable) FIRVisionBarcodeCalendarEvent *calendarEvent;

/** A driver license or ID card. This property is only set if valueType is .driverLicense. */
@property(nonatomic, readonly, nullable) FIRVisionBarcodeDriverLicense *driverLicense;

/** Unavailable. */
- (instancetype)init NS_UNAVAILABLE;

@end

NS_ASSUME_NONNULL_END

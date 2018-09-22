#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import "GMVDetectorConstants.h"

/**
 * Generic feature returned by a GMVDetector.
 */
@interface GMVFeature : NSObject

/**
 * The rectangle that holds the discovered feature relative to the detected image in the view
 * coordinate system.
 */
@property(assign, readonly) CGRect bounds;

/**
 * The type of feature that was discovered.
 */
@property(copy, readonly) NSString *type;

/**
 * Indicates whether the object has a tracking ID.
 */
@property(assign, readonly) BOOL hasTrackingID;

/**
 * The tracking identifier of the feature. This ID is not associated with a specific feature
 * but identifies the same face among consecutive video frames.
 */
@property(assign, readonly) NSUInteger trackingID;

@end

/**
 * An email message from a 'MAILTO:' or similar QR Code type.
 */
@interface GMVBarcodeFeatureEmail : NSObject
/**
 * Email message address.
 */
@property(copy, readonly) NSString *address;

/**
 * Email message body.
 */
@property(copy, readonly) NSString *body;

/**
 * Email message subject.
 */
@property(copy, readonly) NSString *subject;

/**
 * Email message type.
 */
@property(assign, readonly) GMVBarcodeFeatureEmailType type;

@end

/**
 * A phone number from a 'TEL:' or similar QR Code type.
 */
@interface GMVBarcodeFeaturePhone : NSObject

/**
 * Phone number.
 */
@property(copy, readonly) NSString *number;

/**
 * Phone number type.
 */
@property(assign, readonly) GMVBarcodeFeaturePhoneType type;

@end

/**
 * An SMS message from an 'SMS:' or similar QR Code type.
 */
@interface GMVBarcodeFeatureSMS : NSObject

/**
 * An SMS message body.
 */
@property(copy, readonly) NSString *message;

/**
 * An SMS message phone number.
 */
@property(copy, readonly) NSString *phoneNumber;

@end

/**
 * A URL and title from a 'MEBKM:' or similar QR Code type.
 */
@interface GMVBarcodeFeatureURLBookmark : NSObject

/**
 * A URL bookmark title.
 */
@property(copy, readonly) NSString *title;

/**
 * A URL bookmark url.
 */
@property(copy, readonly) NSString *url;

@end

/**
 * Wi-Fi network parameters from a 'WIFI:' or similar QR Code type.
 */
@interface GMVBarcodeFeatureWiFi : NSObject

/**
 * A Wi-Fi access point SSID.
 */
@property(copy, readonly) NSString *ssid;

/**
 * A Wi-Fi access point password.
 */
@property(copy, readonly) NSString *password;

/**
 * A Wi-Fi access point encryption type.
 */
@property(assign, readonly) GMVBarcodeFeatureWiFiEncryptionType type;

@end

/**
 * GPS coordinates from a 'GEO:' or similar QR Code type data.
 */
@interface GMVBarcodeFeatureGeoPoint : NSObject
/**
 * A location latitude.
 */
@property(assign, readonly) double latitude;

/**
 * A location longitude.
 */
@property(assign, readonly) double longitude;

@end

/**
 * An address.
 */
@interface GMVBarcodeFeatureAddress : NSObject

/**
 * Formatted address, containing multiple lines when appropriate.
 */
@property(copy, readonly) NSArray<NSString *> *addressLines;

/**
 * Address type.
 */
@property(assign, readonly) GMVBarcodeFeatureAddressType type;

@end

/**
 * A person's name, both formatted and as individual name components.
 */
@interface GMVBarcodeFeaturePersonName : NSObject

/**
 * Properly formatted name.
 */
@property(copy, readonly) NSString *formattedName;

/**
 * First name.
 */
@property(copy, readonly) NSString *first;

/**
 * Last name.
 */
@property(copy, readonly) NSString *last;

/**
 * Middle name.
 */
@property(copy, readonly) NSString *middle;

/**
 * Name prefix.
 */
@property(copy, readonly) NSString *prefix;

/**
 * Designates a text string to be set as the kana name in the phonebook.
 * Used for Japanese contacts.
 */
@property(copy, readonly) NSString *pronounciation;

/**
 * Name suffix.
 */
@property(copy, readonly) NSString *suffix;

@end

/**
 * A person's or organization's business card. For example, a vCard.
 */
@interface GMVBarcodeFeatureContactInfo : NSObject

/**
 * Person's or organization's addresses.
 */
@property(copy, readonly) NSArray<GMVBarcodeFeatureAddress *> *addresses;

/**
 * Contact emails.
 */
@property(copy, readonly) NSArray<GMVBarcodeFeatureEmail *> *emails;

/**
 * A person's name.
 */
@property(strong, readonly) GMVBarcodeFeaturePersonName *name;

/**
 * Contact phone numbers.
 */
@property(copy, readonly) NSArray<GMVBarcodeFeaturePhone *> *phones;

/**
 * Contact URLs.
 */
@property(copy, readonly) NSArray<NSString *> *urls;

/**
 * Job title.
 */
@property(copy, readonly) NSString *jobTitle;

/**
 * Business organization.
 */
@property(copy, readonly) NSString *organization;

@end

/**
 * A calendar event extracted from a QR code.
 */
@interface GMVBarcodeFeatureCalendarEvent : NSObject

/**
 * Calendar event description.
 */
@property(copy, readonly) NSString *eventDescription;

/**
 * Calendar event location.
 */
@property(copy, readonly) NSString *location;

/**
 * Clendar event organizer.
 */
@property(copy, readonly) NSString *organizer;

/**
 * Calendar event status.
 */
@property(copy, readonly) NSString *status;

/**
 * Calendar event summary.
 */
@property(copy, readonly) NSString *summary;

/**
 * Calendar event start date.
 */
@property(strong, readonly) NSDate *start;

/**
 * Calendar event end date.
 */
@property(strong, readonly) NSDate *end;

@end

/**
 * A driver license or ID card data representation.
 */
@interface GMVBarcodeFeatureDriverLicense : NSObject

/**
 * Holder's first name.
 */
@property(copy, readonly) NSString *firstName;

/**
 * Holder's middle name.
 */
@property(copy, readonly) NSString *middleName;

/**
 * Holder's last name.
 */
@property(copy, readonly) NSString *lastName;

/**
 * Holder's gender. 1 is male and 2 is female.
 */
@property(copy, readonly) NSString *gender;

/**
 * Holder's city address.
 */
@property(copy, readonly) NSString *addressCity;

/**
 * Holder's state address.
 */
@property(copy, readonly) NSString *addressState;

/**
 * Holder's street address.
 */
@property(copy, readonly) NSString *addressStreet;

/**
 * Holder's address' zipcode.
 */
@property(copy, readonly) NSString *addressZip;

/**
 * Holder's birthday. The date format depends on the issuing country.
 */
@property(copy, readonly) NSString *birthDate;

/**
 * "DL" for driver licenses, "ID" for ID cards.
 */
@property(copy, readonly) NSString *documentType;

/**
 * Driver license ID number.
 */
@property(copy, readonly) NSString *licenseNumber;

/**
 * Driver license expiration date. The date format depends on the issuing country.
 */
@property(copy, readonly) NSString *expiryDate;

/**
 * The date format depends on the issuing country.
 */
@property(copy, readonly) NSString *issuingDate;

/**
 * Country in which DL/ID was issued.
 */
@property(copy, readonly) NSString *issuingCountry;

@end

/**
 * Describes a barcode detected in a still image frame. Its properties provide barcode value
 * information.
 */
@interface GMVBarcodeFeature : GMVFeature

/**
 * Barcode value as it was encoded in the barcode. Structured values are not parsed, for example:
 * 'MEBKM:TITLE:Google;URL:https://www.google.com;;'. Does not include the supplemental value.
 */
@property(copy, readonly) NSString *rawValue;

/**
 * Barcode value in a user-friendly format. May omit some of the information encoded in the
 * barcode. For example, in the case above the display_value might be 'https://www.google.com'.
 * If valueFormat==TEXT, this field will be equal to rawValue. This value may be multiline,
 * for example, when line breaks are encoded into the original TEXT barcode value. May include
 * the supplement value.
 */
@property(copy, readonly) NSString *displayValue;

/**
 * Barcode format; for example, EAN_13. Note that this field may contain values not present in the
 * current set of format constants. When mapping this value to something else, it is advisable
 * to have a default/fallback case.
 */
@property(assign, readonly) GMVDetectorBarcodeFormat format;

/**
 * The four corner points of the barcode, in clockwise order starting with the top left relative
 * to the detected image in the view coordinate system. These are CGPoints boxed in NSValues.
 * Due to the possible perspective distortions, this is not necessarily a rectangle.
 */
@property(copy, readonly) NSArray<NSValue *> *cornerPoints;

/**
 * Format of the barcode value. For example, TEXT, PRODUCT, URL, etc. Note that this field may
 * contain values not present in the current set of value format constants. When mapping this
 * value to something else, it is advisable to have a default/fallback case.
 */
@property(assign, readonly) GMVDetectorBarcodeValueFormat valueFormat;

/**
 * An email message from a 'MAILTO:' or similar QR Code type. This properly is only set if
 * valueFormat is GMVDetectorBarcodeValueFormatEmail.
 */
@property(strong, readonly) GMVBarcodeFeatureEmail *email;

/**
 * A phone number from a 'TEL:' or similar QR Code type. This property is only set if valueFormat
 * is GMVDetectorBarcodeValueFormatPhone.
 */
@property(strong, readonly) GMVBarcodeFeaturePhone *phone;

/**
 * An SMS message from an 'SMS:' or similar QR Code type. This property is only set if valueFormat
 * is GMVDetectorBarcodeValueFormatSMS.
 */
@property(strong, readonly) GMVBarcodeFeatureSMS *sms;

/**
 * A URL and title from a 'MEBKM:' or similar QR Code type. This property is only set iff
 * valueFormat is GMVDetectorBarcodeValueFormatURL.
 */
@property(strong, readonly) GMVBarcodeFeatureURLBookmark *url;

/**
 * Wi-Fi network parameters from a 'WIFI:' or similar QR Code type. This property is only set
 * iff valueFormat is GMVDetectorBarcodeValueFormatWifi.
 */
@property(strong, readonly) GMVBarcodeFeatureWiFi *wifi;

/**
 * GPS coordinates from a 'GEO:' or similar QR Code type. This property is only set iff valueFormat
 * is GMVDetectorBarcodeValueFormatGeo
 */
@property(strong, readonly) GMVBarcodeFeatureGeoPoint *geoPoint;

/**
 * A person's or organization's business card. For example a VCARD. This property is only set
 * iff valueFormat is GMVDetectorBarcodeValueFormatContactInfo.
 */
@property(strong, readonly) GMVBarcodeFeatureContactInfo *contactInfo;

/**
 * A calendar event extracted from a QR Code. This property is only set iff valueFormat is
 * GMVDetectorBarcodeValueFormatCalendarEvent.
 */
@property(strong, readonly) GMVBarcodeFeatureCalendarEvent *calendarEvent;

/**
 * A driver license or ID card. This property is only set iff valueFormat is
 * GMVDetectorBarcodeValueFormatDriverLicense.
 */
@property(strong, readonly) GMVBarcodeFeatureDriverLicense *driverLicense;

@end


/**
 * Describes a face detected in a still image frame. Its properties provide face
 * landmark information.
 */
@interface GMVFaceFeature : GMVFeature

#pragma mark - Head properties

/**
 * Indicates whether the detector found the head y euler angle.
 */
@property(assign, readonly) BOOL hasHeadEulerAngleY;

/**
 * Indicates the rotation of the face about the vertical axis of the image.
 * Positive euler y is when the face is turned towards the right side of the image that is being
 * processed.
 */
@property(assign, readonly) CGFloat headEulerAngleY;

/**
 * Indicates whether the detector found the head z euler angle.
 */
@property(assign, readonly) BOOL hasHeadEulerAngleZ;

/**
 * Indicates the rotation of the face about the axis pointing out of the image.
 * Positive euler z is a counter-clockwise rotation within the image plane.
 */
@property(assign, readonly) CGFloat headEulerAngleZ;

#pragma mark - Mouth properties

/**
 * Indicates whether the detector found the face’s mouth corner where the
 * lips meet.
 */
@property(assign, readonly) BOOL hasMouthPosition;

/**
 * The coordinates of the mouth corner where the lips meet, relative to the detected image in
 * the view coordinate system.
 */
@property(assign, readonly) CGPoint mouthPosition;

/**
 * Indicates whether the detector found the face's bottom lip center.
 */
@property(assign, readonly) BOOL hasBottomMouthPosition;

/**
 * The coordinates of the bottom lip center, relative to the detected image in the view
 * coordinate system.
 */
@property(assign, readonly) CGPoint bottomMouthPosition;

/**
 * Indicates whether the detector found the face's right mouth corner.
 */
@property(assign, readonly) BOOL hasRightMouthPosition;

/**
 * The coordinates of the right mouth corner, relative to the detected image in the view
 * coordinate system.
 */
@property(assign, readonly) CGPoint rightMouthPosition;

/**
 * Indicates whether the detector found the face's left mouth corner.
 */
@property(assign, readonly) BOOL hasLeftMouthPosition;

/**
 * The coordinates of the left mouth corner, relative to the detected image in the view
 * coordinate system.
 */
@property(assign, readonly) CGPoint leftMouthPosition;

#pragma mark - Ear properties

/**
 * Indicates whether the detector found the midpoint of the face's left
 * ear tip and left ear lobe.
 */
@property(assign, readonly) BOOL hasLeftEarPosition;

/**
 * The coordinates of the midpoint between the face's midpoint of the left ear tip and left ear
 * lobe, relative to the detected image in the view coordinate system.
 */
@property(assign, readonly) CGPoint leftEarPosition;

/**
 * Indicates wether the detector found the face's left ear tip. Treating the
 * top of the face's left ear as a circle, this is the point at 45 degrees around the circle in
 * Cartesian coordinates.
 */
@property(assign, readonly) BOOL hasRightEarPosition;

/**
 * The coordinates of the midpoint between the face's midpoint of the right ear tip and right ear
 * lobe, relative to the detected image in the view coordinate system.
 */
@property(assign, readonly) CGPoint rightEarPosition;

#pragma mark - Eye properties

/**
 * Indicates whether the detector found the face’s left eye.
 */
@property(assign, readonly) BOOL hasLeftEyePosition;

/**
 * The coordinates of the left eye, relative to the detected image in the view coordinate system.
 */
@property(assign, readonly) CGPoint leftEyePosition;

/**
 * Indicates whether the detector found the face’s right eye.
 */
@property(assign, readonly) BOOL hasRightEyePosition;

/**
 * The coordinates of the right eye, relative to the detected image in the view coordinate system.
 */
@property(assign, readonly) CGPoint rightEyePosition;

#pragma mark - Cheek properties

/**
 * Indicates whether the detector found the face's left cheek.
 */
@property(assign, readonly) BOOL hasLeftCheekPosition;

/**
 * The coordinates of the left cheek, relative to the detected image in the view
 * coordinate system.
 */
@property(assign, readonly) CGPoint leftCheekPosition;

/**
 * Indicates whether the detector found the face's right cheek.
 */
@property(assign, readonly) BOOL hasRightCheekPosition;

/**
 * The coordinates of the right cheek, relative to the detected image in the view
 * coordinate system.
 */
@property(assign, readonly) CGPoint rightCheekPosition;

#pragma mark - Nose properties

/**
 * Indicates whether the detector found the midpoint between the face's
 * nostrils where the nose meets the face.
 */
@property(assign, readonly) BOOL hasNoseBasePosition;

/**
 * The coordinates of the midpoint between the nostrils, relative to the detected image in
 * the view coordinate system.
 */
@property(assign, readonly) CGPoint noseBasePosition;

#pragma mark - Classifier properties

/**
 * Indicates whether a smiling probability is available.
 */
@property(assign, readonly) BOOL hasSmilingProbability;

/**
 * A value between 0.0 and 1.0 giving a probability that the face is smiling.
 **/
@property(assign, readonly) CGFloat smilingProbability;

/**
 * Indicates whether a left eye open probability is available.
 */
@property(assign, readonly) BOOL hasLeftEyeOpenProbability;

/**
 * A value between 0.0 and 1.0 giving a probability that the face's left eye is open.
 */
@property(assign, readonly) CGFloat leftEyeOpenProbability;

/**
 * Indicates whether a right eye open probability is available.
 */
@property(assign, readonly) BOOL hasRightEyeOpenProbability;

/**
 * A value between 0.0 and 1.0 giving a probability that the face's right eye is open.
 */
@property(assign, readonly) CGFloat rightEyeOpenProbability;

@end


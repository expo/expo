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
@property(atomic, assign, readonly) CGRect bounds;

/**
 * The type of feature that was discovered.
 */
@property(atomic, copy, readonly) NSString *type;

/**
 * Indicates whether the object has a tracking ID.
 */
@property(atomic, assign, readonly) BOOL hasTrackingID;

/**
 * The tracking identifier of the feature. This ID is not associated with a specific feature
 * but identifies the same feature among consecutive video frames.
 */
@property(atomic, assign, readonly) NSUInteger trackingID;

@end

/**
 * An email message from a 'MAILTO:' or similar QR Code type.
 */
@interface GMVBarcodeFeatureEmail : NSObject
/**
 * Email message address.
 */
@property(atomic, copy, readonly) NSString *address;

/**
 * Email message body.
 */
@property(atomic, copy, readonly) NSString *body;

/**
 * Email message subject.
 */
@property(atomic, copy, readonly) NSString *subject;

/**
 * Email message type.
 */
@property(atomic, assign, readonly) GMVBarcodeFeatureEmailType type;

@end

/**
 * A phone number from a 'TEL:' or similar QR Code type.
 */
@interface GMVBarcodeFeaturePhone : NSObject

/**
 * Phone number.
 */
@property(atomic, copy, readonly) NSString *number;

/**
 * Phone number type.
 */
@property(atomic, assign, readonly) GMVBarcodeFeaturePhoneType type;

@end

/**
 * An SMS message from an 'SMS:' or similar QR Code type.
 */
@interface GMVBarcodeFeatureSMS : NSObject

/**
 * An SMS message body.
 */
@property(atomic, copy, readonly) NSString *message;

/**
 * An SMS message phone number.
 */
@property(atomic, copy, readonly) NSString *phoneNumber;

@end

/**
 * A URL and title from a 'MEBKM:' or similar QR Code type.
 */
@interface GMVBarcodeFeatureURLBookmark : NSObject

/**
 * A URL bookmark title.
 */
@property(atomic, copy, readonly) NSString *title;

/**
 * A URL bookmark url.
 */
@property(atomic, copy, readonly) NSString *url;

@end

/**
 * Wi-Fi network parameters from a 'WIFI:' or similar QR Code type.
 */
@interface GMVBarcodeFeatureWiFi : NSObject

/**
 * A Wi-Fi access point SSID.
 */
@property(atomic, copy, readonly) NSString *ssid;

/**
 * A Wi-Fi access point password.
 */
@property(atomic, copy, readonly) NSString *password;

/**
 * A Wi-Fi access point encryption type.
 */
@property(atomic, assign, readonly) GMVBarcodeFeatureWiFiEncryptionType type;

@end

/**
 * GPS coordinates from a 'GEO:' or similar QR Code type data.
 */
@interface GMVBarcodeFeatureGeoPoint : NSObject
/**
 * A location latitude.
 */
@property(atomic, assign, readonly) double latitude;

/**
 * A location longitude.
 */
@property(atomic, assign, readonly) double longitude;

@end

/**
 * An address.
 */
@interface GMVBarcodeFeatureAddress : NSObject

/**
 * Formatted address, containing multiple lines when appropriate.
 */
@property(atomic, copy, readonly) NSArray<NSString *> *addressLines;

/**
 * Address type.
 */
@property(atomic, assign, readonly) GMVBarcodeFeatureAddressType type;

@end

/**
 * A person's name, both formatted and as individual name components.
 */
@interface GMVBarcodeFeaturePersonName : NSObject

/**
 * Properly formatted name.
 */
@property(atomic, copy, readonly) NSString *formattedName;

/**
 * First name.
 */
@property(atomic, copy, readonly) NSString *first;

/**
 * Last name.
 */
@property(atomic, copy, readonly) NSString *last;

/**
 * Middle name.
 */
@property(atomic, copy, readonly) NSString *middle;

/**
 * Name prefix.
 */
@property(atomic, copy, readonly) NSString *prefix;

/**
 * Designates a text string to be set as the kana name in the phonebook.
 * Used for Japanese contacts.
 */
@property(atomic, copy, readonly) NSString *pronounciation;

/**
 * Name suffix.
 */
@property(atomic, copy, readonly) NSString *suffix;

@end

/**
 * A person's or organization's business card. For example, a vCard.
 */
@interface GMVBarcodeFeatureContactInfo : NSObject

/**
 * Person's or organization's addresses.
 */
@property(atomic, copy, readonly) NSArray<GMVBarcodeFeatureAddress *> *addresses;

/**
 * Contact emails.
 */
@property(atomic, copy, readonly) NSArray<GMVBarcodeFeatureEmail *> *emails;

/**
 * A person's name.
 */
@property(atomic, strong, readonly) GMVBarcodeFeaturePersonName *name;

/**
 * Contact phone numbers.
 */
@property(atomic, copy, readonly) NSArray<GMVBarcodeFeaturePhone *> *phones;

/**
 * Contact URLs.
 */
@property(atomic, copy, readonly) NSArray<NSString *> *urls;

/**
 * Job title.
 */
@property(atomic, copy, readonly) NSString *jobTitle;

/**
 * Business organization.
 */
@property(atomic, copy, readonly) NSString *organization;

@end

/**
 * A calendar event extracted from a QR code.
 */
@interface GMVBarcodeFeatureCalendarEvent : NSObject

/**
 * Calendar event description.
 */
@property(atomic, copy, readonly) NSString *eventDescription;

/**
 * Calendar event location.
 */
@property(atomic, copy, readonly) NSString *location;

/**
 * Clendar event organizer.
 */
@property(atomic, copy, readonly) NSString *organizer;

/**
 * Calendar event status.
 */
@property(atomic, copy, readonly) NSString *status;

/**
 * Calendar event summary.
 */
@property(atomic, copy, readonly) NSString *summary;

/**
 * Calendar event start date.
 */
@property(atomic, strong, readonly) NSDate *start;

/**
 * Calendar event end date.
 */
@property(atomic, strong, readonly) NSDate *end;

@end

/**
 * A driver license or ID card data representation.
 */
@interface GMVBarcodeFeatureDriverLicense : NSObject

/**
 * Holder's first name.
 */
@property(atomic, copy, readonly) NSString *firstName;

/**
 * Holder's middle name.
 */
@property(atomic, copy, readonly) NSString *middleName;

/**
 * Holder's last name.
 */
@property(atomic, copy, readonly) NSString *lastName;

/**
 * Holder's gender. 1 is male and 2 is female.
 */
@property(atomic, copy, readonly) NSString *gender;

/**
 * Holder's city address.
 */
@property(atomic, copy, readonly) NSString *addressCity;

/**
 * Holder's state address.
 */
@property(atomic, copy, readonly) NSString *addressState;

/**
 * Holder's street address.
 */
@property(atomic, copy, readonly) NSString *addressStreet;

/**
 * Holder's address' zipcode.
 */
@property(atomic, copy, readonly) NSString *addressZip;

/**
 * Holder's birthday. The date format depends on the issuing country.
 */
@property(atomic, copy, readonly) NSString *birthDate;

/**
 * "DL" for driver licenses, "ID" for ID cards.
 */
@property(atomic, copy, readonly) NSString *documentType;

/**
 * Driver license ID number.
 */
@property(atomic, copy, readonly) NSString *licenseNumber;

/**
 * Driver license expiration date. The date format depends on the issuing country.
 */
@property(atomic, copy, readonly) NSString *expiryDate;

/**
 * The date format depends on the issuing country.
 */
@property(atomic, copy, readonly) NSString *issuingDate;

/**
 * Country in which DL/ID was issued.
 */
@property(atomic, copy, readonly) NSString *issuingCountry;

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
@property(atomic, copy, readonly) NSString *rawValue;

/**
 * Barcode value in a user-friendly format. May omit some of the information encoded in the
 * barcode. For example, in the case above the display_value might be 'https://www.google.com'.
 * If valueFormat==TEXT, this field will be equal to rawValue. This value may be multiline,
 * for example, when line breaks are encoded into the original TEXT barcode value. May include
 * the supplement value.
 */
@property(atomic, copy, readonly) NSString *displayValue;

/**
 * Barcode format; for example, EAN_13. Note that this field may contain values not present in the
 * current set of format constants. When mapping this value to something else, it is advisable
 * to have a default/fallback case.
 */
@property(atomic, assign, readonly) GMVDetectorBarcodeFormat format;

/**
 * The four corner points of the barcode, in clockwise order starting with the top left relative
 * to the detected image in the view coordinate system. These are CGPoints boxed in NSValues.
 * Due to the possible perspective distortions, this is not necessarily a rectangle.
 */
@property(atomic, copy, readonly) NSArray<NSValue *> *cornerPoints;

/**
 * Format of the barcode value. For example, TEXT, PRODUCT, URL, etc. Note that this field may
 * contain values not present in the current set of value format constants. When mapping this
 * value to something else, it is advisable to have a default/fallback case.
 */
@property(atomic, assign, readonly) GMVDetectorBarcodeValueFormat valueFormat;

/**
 * An email message from a 'MAILTO:' or similar QR Code type. This properly is only set if
 * valueFormat is GMVDetectorBarcodeValueFormatEmail.
 */
@property(atomic, strong, readonly) GMVBarcodeFeatureEmail *email;

/**
 * A phone number from a 'TEL:' or similar QR Code type. This property is only set if valueFormat
 * is GMVDetectorBarcodeValueFormatPhone.
 */
@property(atomic, strong, readonly) GMVBarcodeFeaturePhone *phone;

/**
 * An SMS message from an 'SMS:' or similar QR Code type. This property is only set if valueFormat
 * is GMVDetectorBarcodeValueFormatSMS.
 */
@property(atomic, strong, readonly) GMVBarcodeFeatureSMS *sms;

/**
 * A URL and title from a 'MEBKM:' or similar QR Code type. This property is only set iff
 * valueFormat is GMVDetectorBarcodeValueFormatURL.
 */
@property(atomic, strong, readonly) GMVBarcodeFeatureURLBookmark *url;

/**
 * Wi-Fi network parameters from a 'WIFI:' or similar QR Code type. This property is only set
 * iff valueFormat is GMVDetectorBarcodeValueFormatWifi.
 */
@property(atomic, strong, readonly) GMVBarcodeFeatureWiFi *wifi;

/**
 * GPS coordinates from a 'GEO:' or similar QR Code type. This property is only set iff valueFormat
 * is GMVDetectorBarcodeValueFormatGeo
 */
@property(atomic, strong, readonly) GMVBarcodeFeatureGeoPoint *geoPoint;

/**
 * A person's or organization's business card. For example a VCARD. This property is only set
 * iff valueFormat is GMVDetectorBarcodeValueFormatContactInfo.
 */
@property(atomic, strong, readonly) GMVBarcodeFeatureContactInfo *contactInfo;

/**
 * A calendar event extracted from a QR Code. This property is only set iff valueFormat is
 * GMVDetectorBarcodeValueFormatCalendarEvent.
 */
@property(atomic, strong, readonly) GMVBarcodeFeatureCalendarEvent *calendarEvent;

/**
 * A driver license or ID card. This property is only set iff valueFormat is
 * GMVDetectorBarcodeValueFormatDriverLicense.
 */
@property(atomic, strong, readonly) GMVBarcodeFeatureDriverLicense *driverLicense;

@end

/**
 * Describes a single element in a line of detected text. An "element" is roughly equivalent to a
 * space-separated "word" in most Latin-script languages.
 */
@interface GMVTextElementFeature : GMVFeature

/**
 * Text contained in this element, in string form.
 */
@property(atomic, copy, readonly) NSString *value;

/**
 * The four corner points of the text line, in clockwise order starting with the top left relative
 * to the detected image in the view coordinate system. These are CGPoints boxed in NSValues.
 */
@property(atomic, copy, readonly) NSArray<NSValue *> *cornerPoints;

@end

/**
 * Describes a single line of detected text.
 */
@interface GMVTextLineFeature : GMVFeature

/**
 * Text contained in this text line, in string form.
 */
@property(atomic, copy, readonly) NSString *value;

/**
 * The prevailing language in the text line. The format is the ISO 639-1 two-letter language code if
 * that is defined (e.g. "en"), or else the ISO 639-2 three-letter code if that is defined.
 */
@property(atomic, copy, readonly) NSString *language;

/**
 * The four corner points of the text line, in clockwise order starting with the top left relative
 * to the detected image in the view coordinate system. These are CGPoints boxed in NSValues.
 */
@property(atomic, copy, readonly) NSArray<NSValue *> *cornerPoints;

/**
 * Text elements in this line.
 */
@property(atomic, copy, readonly) NSArray<GMVTextElementFeature *> *elements;

@end

/**
 * Describes a text block detected in a still image frame. Its properties provide details
 * about detected text.
 */
@interface GMVTextBlockFeature : GMVFeature

/**
 * Text contained in the text block, in string form.
 */
@property(atomic, copy, readonly) NSString *value;

/**
 * The prevailing language in the text block. The format is the ISO 639-1 two-letter language code
 * if that is defined (e.g. "en"), or else the ISO 639-2 three-letter code if that is defined.
 */
@property(atomic, copy, readonly) NSString *language;

/**
 * The four corner points of the text block, in clockwise order starting with the top left relative
 * to the detected image in the view coordinate system. These are CGPoints boxed in NSValues.
 */
@property(atomic, copy, readonly) NSArray<NSValue *> *cornerPoints;

/**
 * The contents of the text block, broken down into individual lines.
 */
@property(atomic, copy, readonly) NSArray<GMVTextLineFeature *> *lines;

@end

/**
 * Describes facial contours in a still image frame. A facial contour is a set of points that
 * outlines a facial landmark or region.
 */
@interface GMVFaceContour : NSObject

/**
 * All contour points.
 */
@property(atomic, copy, readonly) NSArray<NSValue *> *allPoints;
/**
 * A set of points outlines the face oval, relative to the detected image in the view coordinate
 * system.
 */
@property(atomic, copy, readonly) NSArray<NSValue *> *faceContour;
/**
 * A set of points outlines the top of the left eyebrow, relative to the detected image in the view
 * coordinate system.
 */
@property(atomic, copy, readonly) NSArray<NSValue *> *topLeftEyebrowContour;
/**
 * A set of points outlines the bottom of the left eyebrow, relative to the detected image in the
 * view coordinate system.
 */
@property(atomic, copy, readonly) NSArray<NSValue *> *bottomLeftEyebrowContour;
/**
 * A set of points outlines the top of the right eyebrow, relative to the detected image in the
 * view coordinate system.
 */
@property(atomic, copy, readonly) NSArray<NSValue *> *topRightEyebrowContour;
/**
 * A set of points outlines the bottom of the right eyebrow, relative to the detected image in the
 * view coordinate system.
 */
@property(atomic, copy, readonly) NSArray<NSValue *> *bottomRightEyebrowContour;
/**
 * A set of points outlines the left eye, relative to the detected image in the view coordinate
 * system.
 */
@property(atomic, copy, readonly) NSArray<NSValue *> *leftEyeContour;
/**
 * A set of points outlines the right eye, relative to the detected image in the view coordinate
 * system.
 */
@property(atomic, copy, readonly) NSArray<NSValue *> *rightEyeContour;
/**
 * A set of points outlines the top of the upper lip, relative to the detected image in the
 * view coordinate system.
 */
@property(atomic, copy, readonly) NSArray<NSValue *> *topUpperLipContour;
/**
 * A set of points outlines the bottom of the upper lip, relative to the detected image in the
 * view coordinate system.
 */
@property(atomic, copy, readonly) NSArray<NSValue *> *bottomUpperLipContour;
/**
 * A set of points outlines the top of the lower lip, relative to the detected image in the
 * view coordinate system.
 */
@property(atomic, copy, readonly) NSArray<NSValue *> *topLowerLipContour;
/**
 * A set of points outlines the bottom of the lower lip, relative to the detected image in the
 * view coordinate system.
 */
@property(atomic, copy, readonly) NSArray<NSValue *> *bottomLowerLipContour;
/**
 * A set of points outlines the nose bridge, relative to the detected image in the view coordinate
 * system.
 */
@property(atomic, copy, readonly) NSArray<NSValue *> *noseBridgeContour;
/**
 * A set of points outlines the bottom of the nose, relative to the detected image in the view
 * coordinate system.
 */
@property(atomic, copy, readonly) NSArray<NSValue *> *bottomNoseContour;

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
@property(atomic, assign, readonly) BOOL hasHeadEulerAngleY;

/**
 * Indicates the rotation of the face about the vertical axis of the image.
 * Positive euler y is when the face is turned towards the right side of the image that is being
 * processed.
 */
@property(atomic, assign, readonly) CGFloat headEulerAngleY;

/**
 * Indicates whether the detector found the head z euler angle.
 */
@property(atomic, assign, readonly) BOOL hasHeadEulerAngleZ;

/**
 * Indicates the rotation of the face about the axis pointing out of the image.
 * Positive euler z is a counter-clockwise rotation within the image plane.
 */
@property(atomic, assign, readonly) CGFloat headEulerAngleZ;

/**
 * Indicates the rotation of the face about the horizontal axis.
 * Positive euler x is the rotation when the face looks up.
 */
@property(atomic, assign, readonly) CGFloat headEulerAngleX;

/**
 * Indicates whether the detector found the head x euler angle.
 */
@property(atomic, assign, readonly) BOOL hasHeadEulerAngleX;

#pragma mark - Mouth properties

/**
 * Indicates whether the detector found the face’s mouth corner where the
 * lips meet.
 */
@property(atomic, assign, readonly) BOOL hasMouthPosition;

/**
 * The coordinates of the mouth corner where the lips meet, relative to the detected image in
 * the view coordinate system.
 */
@property(atomic, assign, readonly) CGPoint mouthPosition;

/**
 * Indicates whether the detector found the face's bottom lip center.
 */
@property(atomic, assign, readonly) BOOL hasBottomMouthPosition;

/**
 * The coordinates of the bottom lip center, relative to the detected image in the view
 * coordinate system.
 */
@property(atomic, assign, readonly) CGPoint bottomMouthPosition;

/**
 * Indicates whether the detector found the face's right mouth corner.
 */
@property(atomic, assign, readonly) BOOL hasRightMouthPosition;

/**
 * The coordinates of the right mouth corner, relative to the detected image in the view
 * coordinate system.
 */
@property(atomic, assign, readonly) CGPoint rightMouthPosition;

/**
 * Indicates whether the detector found the face's left mouth corner.
 */
@property(atomic, assign, readonly) BOOL hasLeftMouthPosition;

/**
 * The coordinates of the left mouth corner, relative to the detected image in the view
 * coordinate system.
 */
@property(atomic, assign, readonly) CGPoint leftMouthPosition;

#pragma mark - Ear properties

/**
 * Indicates whether the detector found the midpoint of the face's left
 * ear tip and left ear lobe.
 */
@property(atomic, assign, readonly) BOOL hasLeftEarPosition;

/**
 * The coordinates of the midpoint between the face's midpoint of the left ear tip and left ear
 * lobe, relative to the detected image in the view coordinate system.
 */
@property(atomic, assign, readonly) CGPoint leftEarPosition;

/**
 * Indicates whether the detector found the face's left ear tip. Treating the
 * top of the face's left ear as a circle, this is the point at 45 degrees around the circle in
 * Cartesian coordinates.
 */
@property(atomic, assign, readonly) BOOL hasRightEarPosition;

/**
 * The coordinates of the midpoint between the face's midpoint of the right ear tip and right ear
 * lobe, relative to the detected image in the view coordinate system.
 */
@property(atomic, assign, readonly) CGPoint rightEarPosition;

#pragma mark - Eye properties

/**
 * Indicates whether the detector found the face’s left eye.
 */
@property(atomic, assign, readonly) BOOL hasLeftEyePosition;

/**
 * The coordinates of the left eye, relative to the detected image in the view coordinate system.
 */
@property(atomic, assign, readonly) CGPoint leftEyePosition;

/**
 * Indicates whether the detector found the face’s right eye.
 */
@property(atomic, assign, readonly) BOOL hasRightEyePosition;

/**
 * The coordinates of the right eye, relative to the detected image in the view coordinate system.
 */
@property(atomic, assign, readonly) CGPoint rightEyePosition;

#pragma mark - Cheek properties

/**
 * Indicates whether the detector found the face's left cheek.
 */
@property(atomic, assign, readonly) BOOL hasLeftCheekPosition;

/**
 * The coordinates of the left cheek, relative to the detected image in the view
 * coordinate system.
 */
@property(atomic, assign, readonly) CGPoint leftCheekPosition;

/**
 * Indicates whether the detector found the face's right cheek.
 */
@property(atomic, assign, readonly) BOOL hasRightCheekPosition;

/**
 * The coordinates of the right cheek, relative to the detected image in the view
 * coordinate system.
 */
@property(atomic, assign, readonly) CGPoint rightCheekPosition;

#pragma mark - Nose properties

/**
 * Indicates whether the detector found the midpoint between the face's
 * nostrils where the nose meets the face.
 */
@property(atomic, assign, readonly) BOOL hasNoseBasePosition;

/**
 * The coordinates of the midpoint between the nostrils, relative to the detected image in
 * the view coordinate system.
 */
@property(atomic, assign, readonly) CGPoint noseBasePosition;

#pragma mark - Classifier properties

/**
 * Indicates whether a smiling probability is available.
 */
@property(atomic, assign, readonly) BOOL hasSmilingProbability;

/**
 * A value between 0.0 and 1.0 giving a probability that the face is smiling.
 **/
@property(atomic, assign, readonly) CGFloat smilingProbability;

/**
 * Indicates whether a left eye open probability is available.
 */
@property(atomic, assign, readonly) BOOL hasLeftEyeOpenProbability;

/**
 * A value between 0.0 and 1.0 giving a probability that the face's left eye is open.
 */
@property(atomic, assign, readonly) CGFloat leftEyeOpenProbability;

/**
 * Indicates whether a right eye open probability is available.
 */
@property(atomic, assign, readonly) BOOL hasRightEyeOpenProbability;

/**
 * A value between 0.0 and 1.0 giving a probability that the face's right eye is open.
 */
@property(atomic, assign, readonly) CGFloat rightEyeOpenProbability;

/**
 * Describes a set of points that outlines a facial landmark.
 */
@property(atomic, copy, readonly) GMVFaceContour *contour;


@end

/**
 * Describes a label detected in a still image frame. Its properties provide details about the
 * label.
 */
@interface GMVLabelFeature : GMVFeature

/**
 * Machine-generated identifier (thus MID) corresponding to the entity's Google Knowledge Graph
 * entry. For example: "/m/01j51".
 *
 * Note the globally unique MID values remain unchanged across different languages, so you
 * can use this value to tie entities together from different languages. To inspect the MID
 * value, refer to the Google Knowledge Graph API documentation.
 * https://developers.google.com/knowledge-graph/reference/rest/v1/
 */
@property(atomic, copy, readonly) NSString *MID;

/**
 * Description of the label, i.e. human readable string in American English. For example: "Balloon".
 *
 * Note: this is not fit for display purposes, as it is not localized. Use the MID and query the
 * Knowledge Graph to get a localized description of the label.
 */
@property(atomic, copy, readonly) NSString *labelDescription;

/**
 * Confidence score for the label (between 0 and 1).
 *
 * Features coming from a label detector all have scores higher or equal to the detector's
 * configured threshold.
 */
@property(atomic, assign, readonly) float score;

@end

#ifndef GMVDetector_GMVDetectorConstants_h
#define GMVDetector_GMVDetectorConstants_h

#import <Foundation/Foundation.h>

/** @file GMVDetectorConstants.h
 *  Detector constants.
 */

/**
 * @enum GMVImageOrientation
 * This enumeration specifies where the origin (0,0) of the image is located. The constant
 * has the same value as defined by EXIF specifications.
 */
typedef NS_ENUM(NSInteger, GMVImageOrientation) {
  /**
   * Orientation code indicating the 0th row is the top and the 0th column is the left side.
   */
  GMVImageOrientationTopLeft = 1,
  /**
   * Orientation code indicating the 0th row is the top and the 0th column is the right side.
   */
  GMVImageOrientationTopRight = 2,
  /**
   * Orientation code indicating the 0th row is the bottom and the 0th column is the right side.
   */
  GMVImageOrientationBottomRight = 3,
  /**
   * Orientation code indicating the 0th row is the bottom and the 0th column is the left side.
   */
  GMVImageOrientationBottomLeft = 4,
  /**
   * Orientation code indicating the 0th row is the left side and the 0th column is the top.
   */
  GMVImageOrientationLeftTop = 5,
  /**
   * Orientation code indicating the 0th row is the right side and the 0th column is the top.
   */
  GMVImageOrientationRightTop = 6,
  /**
   * Orientation code indicating the 0th row is the right side and the 0th column is the bottom.
   */
  GMVImageOrientationRightBottom = 7,
  /**
   * Orientation code indicating the 0th row is the left side and the 0th column is the
   * bottom.
   */
  GMVImageOrientationLeftBottom = 8
};

/**
 * @enum GMVDetectorFaceModeOption
 * This enum specifies a preference for accuracy vs. speed trade-offs.
 */
typedef NS_ENUM(NSInteger, GMVDetectorFaceModeOption) {
  /**
   * Face detection mode code indicating detect fewer faces and may be less precise in determining
   * values such as position, but will run faster.
   */
  GMVDetectorFaceFastMode = 200,
  /**
   * Face detection mode code indicating detect more faces and may be more precise in determining
   * values such as position, at the cost of speed.
   */
  GMVDetectorFaceAccurateMode = 201
};

/**
 * @options GMVDetectorFaceLandmark
 * This option specifies the landmark detection type.
 */
typedef NS_OPTIONS(NSInteger, GMVDetectorFaceLandmark) {
  /**
   * Face landmark option indicating it performs no landmark detection.
   */
  GMVDetectorFaceLandmarkNone = 1 << 0,
  /**
   * Face landmark option indicating it performs all landmark detection.
   */
  GMVDetectorFaceLandmarkAll = 1 << 1
};

/**
 * @options GMVDetectorFaceClassification
 * This option specifies the classification type.
 */
typedef NS_OPTIONS(NSInteger, GMVDetectorFaceClassification) {
  /**
   * Face classification option indicating it performs no classification.
   */
  GMVDetectorFaceClassificationNone = 1 << 0,
  /**
   * Face classification option indicating it performs all classification.
   */
  GMVDetectorFaceClassificationAll = 1 << 1
};

/**
 * @enum GMVBarcodeFeatureEmailType
 * This enum specifies the email type for GMVBarcodeFeatureEmail.
 */
typedef NS_ENUM(NSInteger, GMVBarcodeFeatureEmailType) {
  /**
   * Unknown email type.
   */
  GMVBarcodeFeatureEmailTypeUnknown = 0,
  /**
   * Barcode feature work email type.
   */
  GMVBarcodeFeatureEmailTypeWork = 1,
  /**
   * Barcode feature home email type.
   */
  GMVBarcodeFeatureEmailTypeHome = 2
};

/**
 * @enum GMVBarcodeFeaturePhoneType
 * This enum specifies the phone type for GMVBarcodeFeaturePhone.
 */
typedef NS_ENUM(NSInteger, GMVBarcodeFeaturePhoneType) {
  /**
   * Unknown phone type.
   */
  GMVBarcodeFeaturePhoneTypeUnknown = 0,
  /**
   * Barcode feature work phone type.
   */
  GMVBarcodeFeaturePhoneTypeWork = 1,
  /**
   * Barcode feature home phone type.
   */
  GMVBarcodeFeaturePhoneTypeHome = 2,
  /**
   * Barcode feature fax phone type.
   */
  GMVBarcodeFeaturePhoneTypeFax = 3,
  /**
   * Barcode feature mobile phone type.
   */
  GMVBarcodeFeaturePhoneTypeMobile = 4
};

/**
 * @enum GMVBarcodeFeatureWiFiEncryptionType
 * This enum specifies the Wi-Fi encryption type for GMVBarcodeFeatureWiFi.
 */
typedef NS_ENUM(NSInteger, GMVBarcodeFeatureWiFiEncryptionType) {
  /**
   * Barcode feature unknown Wi-Fi encryption type.
   */
  GMVBarcodeFeatureWiFiEncryptionTypeUnknown = 0,
  /**
   * Barcode feature open Wi-Fi encryption type.
   */
  GMVBarcodeFeatureWiFiEncryptionTypeOpen = 1,
  /**
   * Barcode feature WPA Wi-Fi encryption type.
   */
  GMVBarcodeFeatureWiFiEncryptionTypeWPA = 2,
  /**
   * Barcode feature WEP Wi-Fi encryption type.
   */
  GMVBarcodeFeatureWiFiEncryptionTypeWEP = 3
};

/**
 * @enum GMVBarcodeFeatureAddressType
 * This enum specifies address type.
 */
typedef NS_ENUM(NSInteger, GMVBarcodeFeatureAddressType) {
  /**
   * Barcode feature unknown address type.
   */
  GMVBarcodeFeatureAddressTypeUnknown = 0,
  /**
   * Barcode feature work address type.
   */
  GMVBarcodeFeatureAddressTypeWork = 1,
  /**
   * Barcode feature home address type.
   */
  GMVBarcodeFeatureAddressTypeHome = 2
};

/**
 * @enum GMVDetectorBarcodeValueFormat
 * This enum specifies a barcode's value format. For example, TEXT, PRODUCT, URL, etc.
 */
typedef NS_ENUM(NSInteger, GMVDetectorBarcodeValueFormat) {
  /**
   * Barcode value format for contact info.
   */
  GMVDetectorBarcodeValueFormatContactInfo = 1,
  /**
   * Barcode value format for email addresses.
   */
  GMVDetectorBarcodeValueFormatEmail = 2,
  /**
   * Barcode value format for ISBNs.
   */
  GMVDetectorBarcodeValueFormatISBN = 3,
  /**
   * Barcode value format for phone numbers.
   */
  GMVDetectorBarcodeValueFormatPhone = 4,
  /**
   * Barcode value format for product codes.
   */
  GMVDetectorBarcodeValueFormatProduct = 5,
  /**
   * Barcode value format for SMS details.
   */
  GMVDetectorBarcodeValueFormatSMS = 6,
  /**
   * Barcode value format for plain text.
   */
  GMVDetectorBarcodeValueFormatText = 7,
  /**
   * Barcode value format for URLs/bookmarks.
   */
  GMVDetectorBarcodeValueFormatURL = 8,
  /**
   * Barcode value format for Wi-Fi access point details.
   */
  GMVDetectorBarcodeValueFormatWiFi = 9,
  /**
   * Barcode value format for geographic coordinates.
   */
  GMVDetectorBarcodeValueFormatGeographicCoordinates = 10,
  /**
   * Barcode value format for calendar events.
   */
  GMVDetectorBarcodeValueFormatCalendarEvent = 11,
  /**
   * Barcode value format for driver's license data.
   */
  GMVDetectorBarcodeValueFormatDriversLicense = 12
};

/**
 * @options GMVDetectorBarcodeFormat
 * This option specifies the barcode formats that the library should detect.
 */
typedef NS_OPTIONS(NSInteger, GMVDetectorBarcodeFormat) {
  /**
   * Code-128 detection.
   */
  GMVDetectorBarcodeFormatCode128 = 0x0001,
  /**
   * Code-39 detection.
   */
  GMVDetectorBarcodeFormatCode39 = 0x0002,
  /**
   * Code-93 detection.
   */
  GMVDetectorBarcodeFormatCode93 = 0x0004,
  /**
   * Codabar detection.
   */
  GMVDetectorBarcodeFormatCodaBar = 0x0008,
  /**
   * Data Matrix detection.
   */
  GMVDetectorBarcodeFormatDataMatrix = 0x0010,
  /**
   * EAN-13 detection.
   */
  GMVDetectorBarcodeFormatEAN13 = 0x0020,
  /**
   * EAN-8 detection.
   */
  GMVDetectorBarcodeFormatEAN8 = 0x0040,
  /**
   * ITF detection.
   */
  GMVDetectorBarcodeFormatITF = 0x0080,
  /**
   * QR Code detection.
   */
  GMVDetectorBarcodeFormatQRCode = 0x0100,
  /**
   * UPC-A detection.
   */
  GMVDetectorBarcodeFormatUPCA = 0x0200,
  /**
   * UPC-E detection.
   */
  GMVDetectorBarcodeFormatUPCE = 0x0400,
  /**
   * PDF-417 detection.
   */
  GMVDetectorBarcodeFormatPDF417 = 0x0800,
  /**
   * Aztec code detection.
   */
  GMVDetectorBarcodeFormatAztec = 0x1000
};

#pragma mark - Detector type constants

/**
 * @memberof GMVDetector
 * A detector that searches for faces in a still image or video, returning GMVFaceFeature
 * objects that provide information about detected faces.
 */
extern NSString * const GMVDetectorTypeFace;

/**
 * @memberof GMVDetector
 * A detector that searches for barcodes in a still image or video, returning GMVBarcodeFeature
 * objects that provide information about detected barcodes.
 */
extern NSString * const GMVDetectorTypeBarcode;

#pragma mark - Barcode Detector Configuration Keys

/**
 * @memberof GMVDetector
 * A key used to specify the barcode detection formats. If not specified, defaults to
 * GMVDetectorBarcodeFormatAllFormats.
 */
extern NSString * const GMVDetectorBarcodeFormats;

#pragma mark - Face Detector Configuration Keys

/**
 * @memberof GMVDetector
 * A key used to specify detector's accuracy/speed trade-offs. If not specified, defaults to
 * GMVDetectorFaceFastMode.
 */
extern NSString * const GMVDetectorFaceMode;

/**
 * @memberof GMVDetector
 * A key used to specify is face tracking feature enabled. If not specified, defaults to false.
 */
extern NSString * const GMVDetectorFaceTrackingEnabled;

/**
 * @memberof GMVDetector
 * A key used to specify the smallest desired face size. The size is expressed as a proportion
 * of the width of the head to the image width. For example, if a value of 0.1 is specified, then
 * the smallest face to search for is roughly 10% of the width of the image being searched.
 * If not specified, defaults to 0.1.
 */
extern NSString * const GMVDetectorFaceMinSize;

/**
 * @memberof GMVDetector
 * A key used to specify whether to run additional classifiers for characterizing attributes
 * such as smiling. If not specified, defaults to GMVDetectorFaceClassificationNone.
 */
extern NSString * const GMVDetectorFaceClassificationType;

/**
 * @memberof GMVDetector
 * A key used to specify whether to detect no landmarks or all landmarks. Processing time
 * increases as the number of landmarks to search for increases, so detecting all landmarks
 * will increase the overall detection time. If not specified, defaults to
 * GMVDetectorFaceLandmarkNone.
 */
extern NSString * const GMVDetectorFaceLandmarkType;

#pragma mark - Face Detector Detection Keys

/**
 * @memberof GMVDetector
 * A key used to specify the display orientation of the image for face feature detection. The
 * value of this key is an NSNumber wrapping a GMVImageOrientation.
 */
extern NSString * const GMVDetectorImageOrientation;

#pragma mark - Feature Types

/**
 * @memberof GMVFeature
 * The discovered feature is a person’s face. Use the GMVFaceFeature class to get more
 * information about the detected feature.
 */
extern NSString * const GMVFeatureTypeFace;

/**
 * @memberof GMVFeature
 * The discovered feature is a barcode. Use the GMVBarcodeFeature class to get more
 * information about the detected feature.
 */
extern NSString * const GMVFeatureTypeBarcode;

#endif

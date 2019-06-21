#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * @options VisionBarcodeFormat
 * This option specifies the barcode formats that the library should detect.
 */
typedef NS_OPTIONS(NSInteger, FIRVisionBarcodeFormat) {
  /**
   * Unknown format.
   */
  FIRVisionBarcodeFormatUnKnown = 0,
  /**
   * All format.
   */
  FIRVisionBarcodeFormatAll = 0xFFFF,
  /**
   * Code-128 detection.
   */
  FIRVisionBarcodeFormatCode128 = 0x0001,
  /**
   * Code-39 detection.
   */
  FIRVisionBarcodeFormatCode39 = 0x0002,
  /**
   * Code-93 detection.
   */
  FIRVisionBarcodeFormatCode93 = 0x0004,
  /**
   * Codabar detection.
   */
  FIRVisionBarcodeFormatCodaBar = 0x0008,
  /**
   * Data Matrix detection.
   */
  FIRVisionBarcodeFormatDataMatrix = 0x0010,
  /**
   * EAN-13 detection.
   */
  FIRVisionBarcodeFormatEAN13 = 0x0020,
  /**
   * EAN-8 detection.
   */
  FIRVisionBarcodeFormatEAN8 = 0x0040,
  /**
   * ITF detection.
   */
  FIRVisionBarcodeFormatITF = 0x0080,
  /**
   * QR Code detection.
   */
  FIRVisionBarcodeFormatQRCode = 0x0100,
  /**
   * UPC-A detection.
   */
  FIRVisionBarcodeFormatUPCA = 0x0200,
  /**
   * UPC-E detection.
   */
  FIRVisionBarcodeFormatUPCE = 0x0400,
  /**
   * PDF-417 detection.
   */
  FIRVisionBarcodeFormatPDF417 = 0x0800,
  /**
   * Aztec code detection.
   */
  FIRVisionBarcodeFormatAztec = 0x1000,
} NS_SWIFT_NAME(VisionBarcodeFormat);

/**
 * Options for specifying a Barcode detector.
 */
NS_SWIFT_NAME(VisionBarcodeDetectorOptions)
@interface FIRVisionBarcodeDetectorOptions : NSObject

/**
 * The barcode formats detected in an image. Note that the detection time will increase for each
 * additional format that is specified.
 */
@property(nonatomic, readonly) FIRVisionBarcodeFormat formats;

/**
 * Initializes an instance that detects all supported barcode formats.
 *
 * @return A new instance of Firebase barcode detector options.
 */
- (instancetype)init;

/**
 * Initializes an instance with the given barcode formats to look for.
 *
 * @param formats The barcode formats to initialize the barcode detector options.
 * @return A new instance of Firebase barcode detector options.
 */
- (instancetype)initWithFormats:(FIRVisionBarcodeFormat)formats NS_DESIGNATED_INITIALIZER;

@end

NS_ASSUME_NONNULL_END

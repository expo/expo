#import <CoreGraphics/CoreGraphics.h>
#import <Foundation/Foundation.h>

@class FIRVisionDocumentTextParagraph;
@class FIRVisionTextRecognizedBreak;
@class FIRVisionTextRecognizedLanguage;

NS_ASSUME_NONNULL_BEGIN

/**
 * @enum VisionDocumentTextBlockType
 * An enum of document text block types.
 */
typedef NS_ENUM(NSInteger, FIRVisionDocumentTextBlockType) {
  /**
   * Unknown document text block type.
   */
  FIRVisionDocumentTextBlockTypeUnknown,
  /**
   * Barcode document text block type.
   */
  FIRVisionDocumentTextBlockTypeBarcode,
  /**
   * Image document text block type.
   */
  FIRVisionDocumentTextBlockTypePicture,
  /**
   * Horizontal/vertical line box document text block type.
   */
  FIRVisionDocumentTextBlockTypeRuler,
  /**
   * Table document text block type.
   */
  FIRVisionDocumentTextBlockTypeTable,
  /**
   * Regular document text block type.
   */
  FIRVisionDocumentTextBlockTypeText,
} NS_SWIFT_NAME(VisionDocumentTextBlockType);

/**
 * A document text block recognized in an image that consists of an array of paragraphs.
 */
NS_SWIFT_NAME(VisionDocumentTextBlock)
@interface FIRVisionDocumentTextBlock : NSObject

/**
 * The detected block type.
 */
@property(nonatomic, readonly) FIRVisionDocumentTextBlockType type;

/**
 * String representation of the document text block that was recognized.
 */
@property(nonatomic, readonly) NSString *text;

/**
 * An array of paragraphs in the block if the type is `VisionDocumentTextBlockType.text`. Otherwise,
 * the array is empty.
 */
@property(nonatomic, readonly) NSArray<FIRVisionDocumentTextParagraph *> *paragraphs;

/**
 * The rectangle that contains the document text block relative to the image in the default
 * coordinate space.
 */
@property(nonatomic, readonly) CGRect frame;

/**
 * The confidence of the recognized document text block.
 */
@property(nonatomic, readonly) NSNumber *confidence;

/**
 * An array of recognized languages in the document text block. If no languages are recognized, the
 * array is empty.
 */
@property(nonatomic, readonly) NSArray<FIRVisionTextRecognizedLanguage *> *recognizedLanguages;

/**
 * The recognized start or end of the document text block.
 */
@property(nonatomic, readonly, nullable) FIRVisionTextRecognizedBreak *recognizedBreak;

/**
 * Unavailable.
 */
- (instancetype)init NS_UNAVAILABLE;

@end

NS_ASSUME_NONNULL_END

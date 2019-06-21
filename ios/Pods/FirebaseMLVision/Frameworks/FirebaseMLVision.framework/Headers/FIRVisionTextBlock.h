#import <CoreGraphics/CoreGraphics.h>
#import <Foundation/Foundation.h>

@class FIRVisionTextLine;
@class FIRVisionTextRecognizedLanguage;

NS_ASSUME_NONNULL_BEGIN

/**
 * A text block recognized in an image that consists of an array of text lines.
 */
NS_SWIFT_NAME(VisionTextBlock)
@interface FIRVisionTextBlock : NSObject

/**
 * String representation of the text block that was recognized.
 */
@property(nonatomic, readonly) NSString *text;

/**
 * An array of text lines that make up the block.
 */
@property(nonatomic, readonly) NSArray<FIRVisionTextLine *> *lines;

/**
 * The rectangle that contains the text block relative to the image in the default coordinate space.
 */
@property(nonatomic, readonly) CGRect frame;

/**
 * An array of recognized languages in the text block. On-device text recognizers only detect
 * Latin-based languages, while cloud text recognizers can detect multiple languages. If no
 * languages are recognized, the array is empty.
 */
@property(nonatomic, readonly) NSArray<FIRVisionTextRecognizedLanguage *> *recognizedLanguages;

/**
 * The four corner points of the text block in clockwise order starting with the top left point
 * relative to the image in the default coordinate space. The `NSValue` objects are `CGPoint`s. For
 * cloud text recognizers, the array is `nil`.
 */
@property(nonatomic, readonly, nullable) NSArray<NSValue *> *cornerPoints;

/**
 * The confidence of the recognized text block. The value is `nil` for all text recognizers except
 * for cloud text recognizers with model type `VisionCloudTextModelType.dense`.
 */
@property(nonatomic, readonly, nullable) NSNumber *confidence;

/**
 * Unavailable.
 */
- (instancetype)init NS_UNAVAILABLE;

@end

NS_ASSUME_NONNULL_END

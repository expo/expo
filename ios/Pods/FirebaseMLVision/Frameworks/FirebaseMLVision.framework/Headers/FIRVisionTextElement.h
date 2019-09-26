#import <CoreGraphics/CoreGraphics.h>
#import <Foundation/Foundation.h>

@class FIRVisionTextRecognizedLanguage;

NS_ASSUME_NONNULL_BEGIN

/**
 * A text element recognized in an image. A text element is roughly equivalent to a space-separated
 * word in most Latin-script languages.
 */
NS_SWIFT_NAME(VisionTextElement)
@interface FIRVisionTextElement : NSObject

/** String representation of the text element that was recognized. */
@property(nonatomic, readonly) NSString *text;

/**
 * The rectangle that contains the text element relative to the image in the default coordinate
 * space.
 */
@property(nonatomic, readonly) CGRect frame;

/** An array of recognized languages in the text element. (Cloud API only.) */
@property(nonatomic, readonly) NSArray<FIRVisionTextRecognizedLanguage *> *recognizedLanguages;

/**
 * The four corner points of the text element in clockwise order starting with the top left point
 * relative to the image in the default coordinate space. The `NSValue` objects are `CGPoint`s. For
 * cloud text recognizers, the array is `nil`.
 */
@property(nonatomic, readonly, nullable) NSArray<NSValue *> *cornerPoints;

/**
 * The confidence of the recognized text element. The value is `nil` for all text recognizers except
 * for cloud text recognizers with model type `VisionCloudTextModelType.dense`.
 */
@property(nonatomic, readonly, nullable) NSNumber *confidence;

/** Unavailable. */
- (instancetype)init NS_UNAVAILABLE;

@end

NS_ASSUME_NONNULL_END

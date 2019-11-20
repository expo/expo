#import <CoreGraphics/CoreGraphics.h>
#import <Foundation/Foundation.h>

@class FIRVisionTextElement;
@class FIRVisionTextRecognizedLanguage;

NS_ASSUME_NONNULL_BEGIN

/** A text line recognized in an image that consists of an array of elements. */
NS_SWIFT_NAME(VisionTextLine)
@interface FIRVisionTextLine : NSObject

/** String representation of the text line that was recognized. */
@property(nonatomic, readonly) NSString *text;

/** An array of text elements that make up the line. */
@property(nonatomic, readonly) NSArray<FIRVisionTextElement *> *elements;

/**
 * The rectangle that contains the text line relative to the image in the default coordinate space.
 */
@property(nonatomic, readonly) CGRect frame;

/**
 * An array of recognized languages in the text line. On-device text recognizers only detect
 * Latin-based languages, while cloud text recognizers can detect multiple languages. If no
 * languages are recognized, the array is empty.
 */
@property(nonatomic, readonly) NSArray<FIRVisionTextRecognizedLanguage *> *recognizedLanguages;

/**
 * The four corner points of the text line in clockwise order starting with the top left point
 * relative to the image in the default coordinate space. The `NSValue` objects are `CGPoint`s. For
 * cloud text recognizers, the array is `nil`.
 */
@property(nonatomic, readonly, nullable) NSArray<NSValue *> *cornerPoints;

/**
 * The confidence of the recognized text line. The value is `nil` for all text recognizers except
 * for cloud text recognizers with model type `VisionCloudTextModelType.dense`.
 */
@property(nonatomic, readonly, nullable) NSNumber *confidence;

/** Unavailable. */
- (instancetype)init NS_UNAVAILABLE;

@end

NS_ASSUME_NONNULL_END

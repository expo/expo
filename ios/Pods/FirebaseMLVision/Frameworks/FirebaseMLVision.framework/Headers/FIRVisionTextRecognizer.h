#import <Foundation/Foundation.h>

@class FIRVisionImage;
@class FIRVisionText;

NS_ASSUME_NONNULL_BEGIN

/**
 * The callback to invoke when the text recognition completes.
 *
 * @param text Recognized text in the image or `nil` if there was an error.
 * @param error The error or `nil`.
 */
typedef void (^FIRVisionTextRecognitionCallback)(FIRVisionText *_Nullable text,
                                                 NSError *_Nullable error)
    NS_SWIFT_NAME(VisionTextRecognitionCallback);

/**
 * @enum VisionTextRecognizerType
 * An enum of text recognizer types.
 */
typedef NS_ENUM(NSInteger, FIRVisionTextRecognizerType) {
  /**
   * On-Device recognizer type.
   */
  FIRVisionTextRecognizerTypeOnDevice,
  /**
   * Cloud recognizer type.
   */
  FIRVisionTextRecognizerTypeCloud,
} NS_SWIFT_NAME(VisionTextRecognizerType);

/**
 * An on-device or cloud text recognizer that recognizes text in an image.
 */
NS_SWIFT_NAME(VisionTextRecognizer)
@interface FIRVisionTextRecognizer : NSObject

/**
 * The text recognizer type.
 */
@property(nonatomic, readonly) FIRVisionTextRecognizerType type;

/**
 * Unavailable. Use `Vision` factory methods.
 */
- (instancetype)init NS_UNAVAILABLE;

/**
 * Processes the given image for on-device or cloud text recognition.
 *
 * @param image The image to process for recognizing text.
 * @param completion Handler to call back on the main queue when text recognition completes.
 */
- (void)processImage:(FIRVisionImage *)image
          completion:(FIRVisionTextRecognitionCallback)completion
    NS_SWIFT_NAME(process(_:completion:));

@end

NS_ASSUME_NONNULL_END

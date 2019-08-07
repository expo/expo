#import <Foundation/Foundation.h>

@class FIRVisionDocumentText;
@class FIRVisionImage;

NS_ASSUME_NONNULL_BEGIN

/**
 * The callback to invoke when the document text recognition completes.
 *
 * @param text Recognized document text in the image or `nil` if there was an error.
 * @param error The error or `nil`.
 */
typedef void (^FIRVisionDocumentTextRecognitionCallback)(FIRVisionDocumentText *_Nullable text,
                                                         NSError *_Nullable error)
    NS_SWIFT_NAME(VisionDocumentTextRecognitionCallback);

/**
 * A cloud document text recognizer that recognizes text in an image.
 */
NS_SWIFT_NAME(VisionDocumentTextRecognizer)
@interface FIRVisionDocumentTextRecognizer : NSObject

/**
 * Unavailable. Use `Vision` factory methods.
 */
- (instancetype)init NS_UNAVAILABLE;

/**
 * Processes the given image for cloud document text recognition.
 *
 * @param image The image to process for recognizing document text.
 * @param completion Handler to call back on the main queue when document text recognition
 *     completes.
 */
- (void)processImage:(FIRVisionImage *)image
          completion:(FIRVisionDocumentTextRecognitionCallback)completion
    NS_SWIFT_NAME(process(_:completion:));

@end

NS_ASSUME_NONNULL_END

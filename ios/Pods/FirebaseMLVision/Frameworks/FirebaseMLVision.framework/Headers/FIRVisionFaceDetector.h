#import <Foundation/Foundation.h>

@class FIRVisionFace;
@class FIRVisionImage;

NS_ASSUME_NONNULL_BEGIN

/**
 * A block containing an array of faces or `nil` if there's an error.
 *
 * @param faces Array of faces detected in the image or `nil` if there was an error.
 * @param error The error or `nil`.
 */
typedef void (^FIRVisionFaceDetectionCallback)(NSArray<FIRVisionFace *> *_Nullable faces,
                                               NSError *_Nullable error)
    NS_SWIFT_NAME(VisionFaceDetectionCallback);

/**
 * A face detector that detects faces in an image.
 */
NS_SWIFT_NAME(VisionFaceDetector)
@interface FIRVisionFaceDetector : NSObject

/**
 * Unavailable. Use `Vision` factory methods.
 */
- (instancetype)init NS_UNAVAILABLE;

/**
 * Processes the given image for face detection. The detection is performed asynchronously and calls
 * back the completion handler with the detected face results or error on the main thread.
 *
 * @param image The vision image to use for detecting faces.
 * @param completion Handler to call back on the main thread with faces detected or error.
 */
- (void)processImage:(FIRVisionImage *)image
          completion:(FIRVisionFaceDetectionCallback)completion
    NS_SWIFT_NAME(process(_:completion:));

/**
 * Returns detected face results in the given image or `nil` if there was an error. The detection is
 * performed synchronously on the calling thread.
 *
 * @discussion It is advised to call this method off the main thread to avoid blocking the UI. As a
 *     result, an `NSException` is raised if this method is called on the main thread.
 * @param image The vision image to use for detecting faces.
 * @param error An optional error parameter populated when there is an error during detection.
 * @return Array of faces detected in the given image or `nil` if there was an error.
 */
- (nullable NSArray<FIRVisionFace *> *)resultsInImage:(FIRVisionImage *)image
                                                error:(NSError **)error;

@end

NS_ASSUME_NONNULL_END

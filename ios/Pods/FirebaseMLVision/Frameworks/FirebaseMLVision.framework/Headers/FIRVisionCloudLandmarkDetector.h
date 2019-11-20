#import <Foundation/Foundation.h>

@class FIRVisionCloudLandmark;
@class FIRVisionImage;

NS_ASSUME_NONNULL_BEGIN

/**
 * A block containing an array of landmark or `nil` if there's an error.
 *
 * @param landmarks Array of landmark detected in the image or `nil` if there was an error.
 * @param error The error or `nil`.
 */
typedef void (^FIRVisionCloudLandmarkDetectionCompletion)(
    NSArray<FIRVisionCloudLandmark *> *_Nullable landmarks, NSError *_Nullable error)
    NS_SWIFT_NAME(VisionCloudLandmarkDetectionCompletion);

/** A landmark detector that detects landmark in an image. */
NS_SWIFT_NAME(VisionCloudLandmarkDetector)
@interface FIRVisionCloudLandmarkDetector : NSObject

/** Unavailable. Use `Vision` factory methods. */
- (instancetype)init NS_UNAVAILABLE;

/**
 * Detects landmark in a given image.
 *
 * @param image The image to use for detecting landmark.
 * @param completion Handler to call back on the main queue with landmark detected or error.
 */
- (void)detectInImage:(FIRVisionImage *)image
           completion:(FIRVisionCloudLandmarkDetectionCompletion)completion;

@end

NS_ASSUME_NONNULL_END

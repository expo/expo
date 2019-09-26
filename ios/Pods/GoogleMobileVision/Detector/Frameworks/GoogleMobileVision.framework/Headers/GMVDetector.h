#import <AVFoundation/AVFoundation.h>

#import "GMVFeature.h"

NS_ASSUME_NONNULL_BEGIN

/**
 *  A GMVDetector object uses image processing to search for and identify notable features in a
 *  still image or video. Detected features are represented by GMVFeature objects that provide more
 *  information about each feature.
 */
@interface GMVDetector : NSObject

/**
 *  Creates and returns a configured detector.
 *  @param type Identifies which type of detector should be created.
 *  @param options Configuration options for the detector.
 *  @return The |type| detector. The detector maybe nil if initialization failed.
 */
+ (nullable GMVDetector *)detectorOfType:(NSString *)type options:(nullable NSDictionary *)options;

/**
 *  Searches for features in an image.
 *  @param options Configuration options for runtime detection. Use the GMVDetectorImageOrientation
 *  key to specify the image orientation.
 *  @return The array of detected features, or nil if an error occurred.
 */
- (nullable NSArray<__kindof GMVFeature *> *)featuresInImage:(UIImage *)image
                                                     options:(nullable NSDictionary *)options;

/**
 *  Searches for features in an image buffer.
 *  @param options Configuration options for runtime detection. Use the GMVDetectorImageOrientation
 *  key to specify the image orientation.
 *  @return The array of detected features, or nil if an error occurred.
 */
- (nullable NSArray<__kindof GMVFeature *> *)featuresInBuffer:(CMSampleBufferRef)sampleBuffer
                                                      options:(nullable NSDictionary *)options;

@end

NS_ASSUME_NONNULL_END

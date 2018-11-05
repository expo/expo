#import "GMVFeature.h"

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
 */
+ (GMVDetector *)detectorOfType:(NSString *)type options:(NSDictionary *)options;

/**
 *  Searches for features in an image.
 *  @param options Configuration options for run time detection. Use the GMVDetectorImageOrientation
 *  key to specify the image orientation.
 */
- (NSArray<__kindof GMVFeature *> *)featuresInImage:(UIImage *)image
                                            options:(NSDictionary *)options;

@end

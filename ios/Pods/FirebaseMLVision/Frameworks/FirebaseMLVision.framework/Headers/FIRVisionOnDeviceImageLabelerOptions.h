#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/** Options for an on-device image labeler. */
NS_SWIFT_NAME(VisionOnDeviceImageLabelerOptions)
@interface FIRVisionOnDeviceImageLabelerOptions : NSObject

/**
 * The confidence threshold for labels returned by the image labeler. Labels returned by the image
 * labeler will have a confidence level higher or equal to the given threshold. Values must be in
 * range [0, 1]. If unset or an invalid value is set, the default threshold of 0.5 is used. There is
 * no limit on the maximum number of labels returned by an on-device image labeler.
 */
@property(nonatomic) float confidenceThreshold;

/**
 * Designated initializer that creates a new instance of on-device image labeler options with the
 * default values.
 */
- (instancetype)init NS_DESIGNATED_INITIALIZER;

@end

NS_ASSUME_NONNULL_END

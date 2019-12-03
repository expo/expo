#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/** Options for a cloud image labeler. */
NS_SWIFT_NAME(VisionCloudImageLabelerOptions)
@interface FIRVisionCloudImageLabelerOptions : NSObject

/**
 * The confidence threshold for labels returned by the image labeler. Labels returned by the image
 * labeler will have a confidence level higher or equal to the given threshold. Values must be in
 * range [0, 1]. If unset or an invalid value is set, the default threshold of 0.5 is used. Up to 20
 * labels with the top confidence will be returned.
 */
@property(nonatomic) float confidenceThreshold;

/**
 * API key to use for Cloud Vision API. If `nil`, the default API key from FirebaseApp will be used.
 */
@property(nonatomic, copy, nullable) NSString *APIKeyOverride;

/**
 * Designated initializer that creates a new instance of cloud image labeler options with the
 * default values.
 */
- (instancetype)init NS_DESIGNATED_INITIALIZER;

@end

NS_ASSUME_NONNULL_END

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * @enum VisionCloudModelType
 * Type of model to use in vision cloud detection API.
 */
typedef NS_ENUM(NSUInteger, FIRVisionCloudModelType) {
  /** Stable model. */
  FIRVisionCloudModelTypeStable,
  /** Latest model. */
  FIRVisionCloudModelTypeLatest,
} NS_SWIFT_NAME(VisionCloudModelType);

/** Generic options of a vision cloud detector. */
NS_SWIFT_NAME(VisionCloudDetectorOptions)
@interface FIRVisionCloudDetectorOptions : NSObject

/** Type of model to use in vision cloud detection API. Defaults to `.stable`. */
@property(nonatomic) FIRVisionCloudModelType modelType;

/**
 * Maximum number of results to return. Defaults to 10. Does not apply to `VisionTextRecognizer`
 * and `VisionDocumentTextRecognizer`.
 */
@property(nonatomic) NSUInteger maxResults;

/**
 * API key to use for Cloud Vision API. If `nil`, the default API key from FirebaseApp will be used.
 */
@property(nonatomic, copy, nullable) NSString *APIKeyOverride;

@end

NS_ASSUME_NONNULL_END

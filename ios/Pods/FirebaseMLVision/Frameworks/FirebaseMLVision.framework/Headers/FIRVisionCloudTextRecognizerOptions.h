#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * @enum VisionCloudTextModelType
 * An enum of model types for cloud text recognition.
 */
typedef NS_ENUM(NSUInteger, FIRVisionCloudTextModelType) {
  /**
   * Sparse or regular text cloud model type.
   */
  FIRVisionCloudTextModelTypeSparse,
  /**
   * Dense or document text cloud model type.
   */
  FIRVisionCloudTextModelTypeDense,
} NS_SWIFT_NAME(VisionCloudTextModelType);

/**
 * Options for a cloud text recognizer.
 */
NS_SWIFT_NAME(VisionCloudTextRecognizerOptions)
@interface FIRVisionCloudTextRecognizerOptions : NSObject

/**
 * Model type for cloud text recognition. The default is `VisionCloudTextModelType.sparse`.
 */
@property(nonatomic) FIRVisionCloudTextModelType modelType;

/**
 * An array of hinted language codes for cloud text recognition. The default is `nil`. See
 * https://cloud.google.com/vision/docs/languages for supported language codes.
 */
@property(nonatomic, copy, nullable) NSArray<NSString *> *languageHints;

/**
 * API key to use for Cloud Vision API. If `nil`, the default API key from FirebaseApp will be used.
 */
@property(nonatomic, copy, nullable) NSString *APIKeyOverride;

/**
 * Designated initializer that creates a new instance of cloud text recognizer options.
 */
- (instancetype)init NS_DESIGNATED_INITIALIZER;

@end

NS_ASSUME_NONNULL_END

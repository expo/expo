#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/** Options for a cloud document text recognizer. */
NS_SWIFT_NAME(VisionCloudDocumentTextRecognizerOptions)
@interface FIRVisionCloudDocumentTextRecognizerOptions : NSObject

/**
 * An array of hinted language codes for cloud document text recognition. The default is `nil`. See
 * https://cloud.google.com/vision/docs/languages for supported language codes.
 */
@property(nonatomic, copy, nullable) NSArray<NSString *> *languageHints;

/**
 * API key to use for Cloud Vision API. If `nil`, the default API key from FirebaseApp will be used.
 */
@property(nonatomic, copy, nullable) NSString *APIKeyOverride;

/** Designated initializer that creates a new instance of cloud document text recognizer options. */
- (instancetype)init NS_DESIGNATED_INITIALIZER;

@end

NS_ASSUME_NONNULL_END

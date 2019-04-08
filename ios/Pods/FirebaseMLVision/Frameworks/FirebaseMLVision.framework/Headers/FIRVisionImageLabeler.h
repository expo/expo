#import <Foundation/Foundation.h>

@class FIRVisionImageLabel;
@class FIRVisionImage;

NS_ASSUME_NONNULL_BEGIN

/**
 * A block containing an array of labels or `nil` if there's an error.
 *
 * @param labels Array of labels detected in the image or `nil` if there was an error.
 * @param error The error or `nil`.
 */
typedef void (^FIRVisionImageLabelerCallback)(NSArray<FIRVisionImageLabel *> *_Nullable labels,
                                              NSError *_Nullable error)
    NS_SWIFT_NAME(VisionImageLabelerCallback);

/**
 * @enum VisionImageLabelerType
 * An enum of image labeler types.
 */
typedef NS_ENUM(NSUInteger, FIRVisionImageLabelerType) {
  /** On-device image labeler type. */
  FIRVisionImageLabelerTypeOnDevice,
  /** Cloud image labeler type. */
  FIRVisionImageLabelerTypeCloud,
} NS_SWIFT_NAME(VisionImageLabelerType);

/**
 * An on-device or cloud image labeler for labeling images.
 */
NS_SWIFT_NAME(VisionImageLabeler)
@interface FIRVisionImageLabeler : NSObject

/** The image labeler type. */
@property(nonatomic, readonly) FIRVisionImageLabelerType type;

/**
 * Unavailable. Use `Vision` factory methods.
 */
- (instancetype)init NS_UNAVAILABLE;

/**
 * Processes the given image for on-device or cloud image labeling.
 *
 * @param image The image to process.
 * @param completion Handler to call back on the main queue with labels or error.
 */
- (void)processImage:(FIRVisionImage *)image
          completion:(FIRVisionImageLabelerCallback)completion
    NS_SWIFT_NAME(process(_:completion:));

@end

NS_ASSUME_NONNULL_END

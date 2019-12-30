#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/** Configurations for model downloading conditions. */
NS_SWIFT_NAME(ModelDownloadConditions)
@interface FIRModelDownloadConditions : NSObject<NSCopying>

/**
 * Indicates whether download requests should be made over a cellular network. The default is `YES`.
 */
@property(nonatomic, readonly) BOOL allowsCellularAccess;

/**
 * Indicates whether the model can be downloaded while the app is in the background. The default is
 * `NO`.
 */
@property(nonatomic, readonly) BOOL allowsBackgroundDownloading;

/**
 * Creates a new instance with the given conditions.
 *
 * @param allowsCellularAccess Whether download requests should be made over a cellular network.
 * @param allowsBackgroundDownloading Whether the model can be downloaded while the app is in the
 *     background.
 * @return A new `ModelDownloadConditions` instance.
 */
- (instancetype)initWithAllowsCellularAccess:(BOOL)allowsCellularAccess
                 allowsBackgroundDownloading:(BOOL)allowsBackgroundDownloading
    NS_DESIGNATED_INITIALIZER;

/**
 * Creates a new instance with the default conditions. The default values are specified in the
 * documentation for each instance property.
 *
 * @return A new `ModelDownloadConditions` instance.
 */
- (instancetype)init;

@end

NS_ASSUME_NONNULL_END

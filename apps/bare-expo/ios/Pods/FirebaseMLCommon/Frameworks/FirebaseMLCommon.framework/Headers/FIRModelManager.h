#import <Foundation/Foundation.h>

@class FIRApp;
@class FIRModelDownloadConditions;
@class FIRRemoteModel;

NS_ASSUME_NONNULL_BEGIN

/** Manages models that are used by MLKit features. */
NS_SWIFT_NAME(ModelManager)
@interface FIRModelManager : NSObject

/**
 * Returns the `ModelManager` instance for the default Firebase app. The default Firebase app
 * instance must be configured before calling this method; otherwise, raises `FIRAppNotConfigured`
 * exception.
 *
 * @return The `ModelManager` instance for the default Firebase app.
 */
+ (instancetype)modelManager NS_SWIFT_NAME(modelManager());

/**
 * Returns the `ModelManager` instance for the given custom Firebase app. The custom Firebase app
 * instance must be configured before calling this method; otherwise, raises `FIRAppNotConfigured`
 * exception.
 *
 * @param app The custom Firebase app instance.
 * @return The `ModelManager` instance for the given custom Firebase app.
 */
+ (instancetype)modelManagerForApp:(FIRApp *)app NS_SWIFT_NAME(modelManager(app:));

/** Unavailable. Use the `modelManager()` or `modelManager(app:)` class methods. */
- (instancetype)init NS_UNAVAILABLE;

/**
 * Checks whether the given model has been downloaded.
 *
 * @param remoteModel The model to check the download status for.
 * @return Whether the given model has been downloaded.
 */
- (BOOL)isModelDownloaded:(FIRRemoteModel *)remoteModel;

/**
 * Downloads the given model from the server to a local directory on the device. Use
 * `isModelDownloaded(_:)` to check the download status for the model. If this method is invoked and
 * the model has already been downloaded, a request is made to check if a newer version of the model
 * is available for download. If available, the new version of the model is downloaded.
 *
 * @discussion To be notified when a model download request completes, observe the
 *     '.firebaseMLModelDownloadDidSucceed` and `.firebaseMLModelDownloadDidFail` notifications
 *     defined in `FIRModelDownloadNotifications.h`.
 *
 * @param remoteModel The model to download.
 * @param conditions The conditions for downloading the model.
 * @return Progress for downloading the model.
 */
- (NSProgress *)downloadModel:(FIRRemoteModel *)remoteModel
                   conditions:(FIRModelDownloadConditions *)conditions
    NS_SWIFT_NAME(download(_:conditions:));

/**
 * Deletes the downloaded model from the device.
 *
 * @param remoteModel The downloaded model to delete.
 * @param completion Handler to call back on the main queue when the model deletion completed
 *     successfully or failed with the given `error`.
 */
- (void)deleteDownloadedModel:(FIRRemoteModel *)remoteModel
                   completion:(void (^)(NSError *_Nullable error))completion;

@end

NS_ASSUME_NONNULL_END

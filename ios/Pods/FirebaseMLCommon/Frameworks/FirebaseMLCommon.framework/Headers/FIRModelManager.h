#import <Foundation/Foundation.h>

@class FIRLocalModel;
@class FIRRemoteModel;

NS_ASSUME_NONNULL_BEGIN

/** Manages models that are used by MLKit features. */
NS_SWIFT_NAME(ModelManager)
@interface FIRModelManager : NSObject

/**
 * Returns the `ModelManager` instance for the default Firebase app. The default Firebase app
 * instance must be configured before calling this method; otherwise, raises `FIRAppNotConfigured`
 * exception. Models hosted in non-default Firebase apps are currently not supported. The returned
 * model manager is thread safe.
 *
 * @return The `ModelManager` instance for the default Firebase app.
 */
+ (instancetype)modelManager NS_SWIFT_NAME(modelManager());

/** Unavailable. Use the `modelManager()` class method. */
- (instancetype)init NS_UNAVAILABLE;

/**
 * Registers a remote model. The model name is unique to each remote model and can only be
 * registered once with a given instance of `ModelManager`. The model name should be the same name
 * used when the model was uploaded to the Firebase Console. It's OK to separately register a remote
 * and local model with the same name for a given instance of `ModelManager`.
 *
 * @param remoteModel The remote model to register.
 * @return Whether the registration was successful. Returns `NO` if the given `remoteModel` is
 *     invalid or has already been registered.
 */
- (BOOL)registerRemoteModel:(FIRRemoteModel *)remoteModel;

/**
 * Registers a local model. The model name is unique to each local model and can only be registered
 * once with a given instance of `ModelManager`. It's OK to separately register a remote and local
 * model with the same name for a given instance of `ModelManager`.
 *
 * @param localModel The local model to register.
 * @return Whether the registration was successful. Returns `NO` if the given `localModel` is
 *     invalid or has already been registered.
 */
- (BOOL)registerLocalModel:(FIRLocalModel *)localModel;

/**
 * Returns the registered remote model with the given name. Returns `nil` if the model was never
 * registered with this model manager.
 *
 * @param name Name of the remote model.
 * @return The remote model that was registered with the given name. Returns `nil` if the model was
 *     never registered with this model manager.
 */
- (nullable FIRRemoteModel *)remoteModelWithName:(NSString *)name;

/**
 * Returns the registered local model with the given name. Returns `nil` if the model was never
 * registered with this model manager.
 *
 * @param name Name of the local model.
 * @return The local model that was registered with the given name. Returns `nil` if the model was
 *     never registered with this model manager.
 */
- (nullable FIRLocalModel *)localModelWithName:(NSString *)name;

/**
 * Checks whether the given remote model has been downloaded.
 *
 * @discussion If the given remote model has not been registered yet, then this method returns `NO`.
 *
 * @param remoteModel The remote model to check the download status for.
 * @return Whether the given model has been downloaded.
 */
- (BOOL)isRemoteModelDownloaded:(FIRRemoteModel *)remoteModel;

/**
 * Downloads the given remote model from the server to a local directory on the device, if the model
 * hasn't already been downloaded. Use `isRemoteModelDownloaded(_:)` to check the download status
 * for the remote model.
 *
 * @discussion To be notified when a model download request completes, observe the
 *     '.firebaseMLModelDownloadDidSucceed` and `.firebaseMLModelDownloadDidFail` notifications
 *     defined in `FIRModelDownloadNotifications.h`. If the given remote model has not been
 *     registered yet, then this method returns completed progress and posts a
 *     `.firebaseMLModelDownloadDidFail` notification. The download conditions provided at the time
 *     the model was registered will be used for this download request.
 *
 * @param remoteModel The remote model to download.
 * @return Progress for downloading the model.
 */
- (NSProgress *)downloadRemoteModel:(FIRRemoteModel *)remoteModel NS_SWIFT_NAME(download(_:));

@end

NS_ASSUME_NONNULL_END

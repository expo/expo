#import <Foundation/Foundation.h>

@class FIRModelDownloadConditions;

NS_ASSUME_NONNULL_BEGIN

/** A model that is stored remotely on the server and downloaded to the device. */
NS_SWIFT_NAME(RemoteModel)
@interface FIRRemoteModel : NSObject

/** The model name. */
@property(nonatomic, copy, readonly) NSString *name;

/** Indicates whether model updates are allowed. */
@property(nonatomic, readonly) BOOL allowsModelUpdates;

/** Initial downloading conditions for the model. */
@property(nonatomic, readonly) FIRModelDownloadConditions *initialConditions;

/** Downloading conditions for subsequent calls to update the model. */
@property(nonatomic, readonly) FIRModelDownloadConditions *updateConditions;

/**
 * Creates an instance of `RemoteModel` with the given name and download conditions.
 *
 * @param name The name of the remote model. Specify the name assigned to the model when it was
 *     uploaded to the Firebase Console. Within the same Firebase app, all remote models should have
 *     distinct names.
 * @param allowsModelUpdates Indicates whether model updates are allowed.
 * @param initialConditions Initial downloading conditions for the model.
 * @param updateConditions Downloading conditions for subsequent calls to update the model. If `nil`
 *     is passed and `allowsModelUpdates` is `YES`, the default download conditions are used via the
 *     `ModelDownloadConditions` `init` call.
 * @return A new `RemoteModel` instance.
 */
- (instancetype)initWithName:(NSString *)name
          allowsModelUpdates:(BOOL)allowsModelUpdates
           initialConditions:(FIRModelDownloadConditions *)initialConditions
            updateConditions:(nullable FIRModelDownloadConditions *)updateConditions
    NS_SWIFT_NAME(init(name:allowsModelUpdates:initialConditions:updateConditions:));

/** Unavailable. */
- (instancetype)init NS_UNAVAILABLE;

@end

NS_ASSUME_NONNULL_END

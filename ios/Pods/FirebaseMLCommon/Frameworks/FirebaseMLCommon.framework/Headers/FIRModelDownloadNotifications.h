#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * `Notification` name for observing model download tasks that succeed. The user info dictionary
 * will contain `{ModelDownloadUserInfoKey.remoteModel : RemoteModel}`.
 */
extern NSNotificationName const FIRModelDownloadDidSucceedNotification
    NS_SWIFT_NAME(firebaseMLModelDownloadDidSucceed);

/**
 * `Notification` name for observing model download tasks that fail. The user info dictionary will
 * contain `{ModelDownloadUserInfoKey.remoteModel : RemoteModel}` and
 * `{ModelDownloadUserInfoKey.error : NSError}`.
 */
extern NSNotificationName const FIRModelDownloadDidFailNotification
    NS_SWIFT_NAME(firebaseMLModelDownloadDidFail);

/**
 * The type used for retrieving information from the `Notification` user info dictionary for remote
 * model downloading.
 */
typedef NSString *FIRModelDownloadUserInfoKey NS_EXTENSIBLE_STRING_ENUM
    NS_SWIFT_NAME(ModelDownloadUserInfoKey);

/** The key for retrieving the `RemoteModel` from the user info dictionary. */
extern FIRModelDownloadUserInfoKey const FIRModelDownloadUserInfoKeyRemoteModel;

/**
 * The key for retrieving the `NSError` from the user info dictionary. The corresponding value is
 * `nil` if the model download completed successfully.
 */
extern FIRModelDownloadUserInfoKey const FIRModelDownloadUserInfoKeyError;

NS_ASSUME_NONNULL_END

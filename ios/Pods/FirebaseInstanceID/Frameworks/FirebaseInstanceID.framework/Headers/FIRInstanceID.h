#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@class FIRInstanceIDResult;
/**
 *  @memberof FIRInstanceID
 *
 *  The scope to be used when fetching/deleting a token for Firebase Messaging.
 */
FOUNDATION_EXPORT NSString *const kFIRInstanceIDScopeFirebaseMessaging
    NS_SWIFT_NAME(InstanceIDScopeFirebaseMessaging);

#if defined(__IPHONE_10_0) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_10_0
/**
 *  Called when the system determines that tokens need to be refreshed.
 *  This method is also called if Instance ID has been reset in which
 *  case, tokens and FCM topic subscriptions also need to be refreshed.
 *
 *  Instance ID service will throttle the refresh event across all devices
 *  to control the rate of token updates on application servers.
 */
FOUNDATION_EXPORT const NSNotificationName kFIRInstanceIDTokenRefreshNotification
    NS_SWIFT_NAME(InstanceIDTokenRefresh);
#else
/**
 *  Called when the system determines that tokens need to be refreshed.
 *  This method is also called if Instance ID has been reset in which
 *  case, tokens and FCM topic subscriptions also need to be refreshed.
 *
 *  Instance ID service will throttle the refresh event across all devices
 *  to control the rate of token updates on application servers.
 */
FOUNDATION_EXPORT NSString *const kFIRInstanceIDTokenRefreshNotification
    NS_SWIFT_NAME(InstanceIDTokenRefreshNotification);
#endif  // defined(__IPHONE_10_0) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_10_0

/**
 *  @related FIRInstanceID
 *
 *  The completion handler invoked when the InstanceID token returns. If
 *  the call fails we return the appropriate `error code` as described below.
 *
 *  @param token The valid token as returned by InstanceID backend.
 *
 *  @param error The error describing why generating a new token
 *               failed. See the error codes below for a more detailed
 *               description.
 */
typedef void (^FIRInstanceIDTokenHandler)(NSString *__nullable token, NSError *__nullable error)
    NS_SWIFT_NAME(InstanceIDTokenHandler);

/**
 *  @related FIRInstanceID
 *
 *  The completion handler invoked when the InstanceID `deleteToken` returns. If
 *  the call fails we return the appropriate `error code` as described below
 *
 *  @param error The error describing why deleting the token failed.
 *               See the error codes below for a more detailed description.
 */
typedef void (^FIRInstanceIDDeleteTokenHandler)(NSError *error)
    NS_SWIFT_NAME(InstanceIDDeleteTokenHandler);

/**
 *  @related FIRInstanceID
 *
 *  The completion handler invoked when the app identity is created. If the
 *  identity wasn't created for some reason we return the appropriate error code.
 *
 *  @param identity A valid identity for the app instance, nil if there was an error
 *                  while creating an identity.
 *  @param error    The error if fetching the identity fails else nil.
 */
typedef void (^FIRInstanceIDHandler)(NSString *__nullable identity, NSError *__nullable error)
    NS_SWIFT_NAME(InstanceIDHandler);

/**
 *  @related FIRInstanceID
 *
 *  The completion handler invoked when the app identity and all the tokens associated
 *  with it are deleted. Returns a valid error object in case of failure else nil.
 *
 *  @param error The error if deleting the identity and all the tokens associated with
 *               it fails else nil.
 */
typedef void (^FIRInstanceIDDeleteHandler)(NSError *__nullable error)
    NS_SWIFT_NAME(InstanceIDDeleteHandler);

/**
 *  @related FIRInstanceID
 *
 *  The completion handler invoked when the app identity and token are fetched. If the
 *  identity wasn't created for some reason we return the appropriate error code.
 *
 *  @param result   The result containing an identity for the app instance and a valid token,
 *                  nil if there was an error while creating the result.
 *  @param error    The error if fetching the identity or token fails else nil.
 */
typedef void (^FIRInstanceIDResultHandler)(FIRInstanceIDResult *__nullable result,
                                           NSError *__nullable error)
    NS_SWIFT_NAME(InstanceIDResultHandler);

/**
 * Public errors produced by InstanceID.
 */
typedef NS_ENUM(NSUInteger, FIRInstanceIDError) {
  // Http related errors.

  /// Unknown error.
  FIRInstanceIDErrorUnknown = 0,

  /// Auth Error -- GCM couldn't validate request from this client.
  FIRInstanceIDErrorAuthentication = 1,

  /// NoAccess -- InstanceID service cannot be accessed.
  FIRInstanceIDErrorNoAccess = 2,

  /// Timeout -- Request to InstanceID backend timed out.
  FIRInstanceIDErrorTimeout = 3,

  /// Network -- No network available to reach the servers.
  FIRInstanceIDErrorNetwork = 4,

  /// OperationInProgress -- Another similar operation in progress,
  /// bailing this one.
  FIRInstanceIDErrorOperationInProgress = 5,

  /// InvalidRequest -- Some parameters of the request were invalid.
  FIRInstanceIDErrorInvalidRequest = 7,
} NS_SWIFT_NAME(InstanceIDError);

/**
 * A class contains the results of InstanceID and token query.
 */
NS_SWIFT_NAME(InstanceIDResult)
@interface FIRInstanceIDResult : NSObject <NSCopying>

/**
 * An instanceID uniquely identifies the app instance.
 */
@property(nonatomic, readonly, copy) NSString *instanceID;

/*
 * Returns a Firebase Messaging scoped token for the firebase app.
 */
@property(nonatomic, readonly, copy) NSString *token;

@end

/**
 *  Instance ID provides a unique identifier for each app instance and a mechanism
 *  to authenticate and authorize actions (for example, sending an FCM message).
 *
 *  Once an InstanceID is generated, the library periodically sends information about the
 *  application and the device where it's running to the Firebase backend. To stop this. see
 *  `[FIRInstanceID deleteIDWithHandler:]`.
 *
 *  Instance ID is long lived but, may be reset if the device is not used for
 *  a long time or the Instance ID service detects a problem.
 *  If Instance ID is reset, the app will be notified via
 *  `kFIRInstanceIDTokenRefreshNotification`.
 *
 *  If the Instance ID has become invalid, the app can request a new one and
 *  send it to the app server.
 *  To prove ownership of Instance ID and to allow servers to access data or
 *  services associated with the app, call
 *  `[FIRInstanceID tokenWithAuthorizedEntity:scope:options:handler]`.
 */
NS_SWIFT_NAME(InstanceID)
@interface FIRInstanceID : NSObject

/**
 *  FIRInstanceID.
 *
 *  @return A shared instance of FIRInstanceID.
 */
+ (instancetype)instanceID NS_SWIFT_NAME(instanceID());

/**
 *  Unavailable. Use +instanceID instead.
 */
- (instancetype)init __attribute__((unavailable("Use +instanceID instead.")));

#pragma mark - Tokens

/**
 * Returns a result of app instance identifier InstanceID and a Firebase Messaging scoped token.
 * param handler    The callback handler invoked when an app instanceID and a default token
 *                  are generated and returned. If instanceID and token fetching fail for some
 *                  reason the callback is invoked with nil `result` and the appropriate error.
 */
- (void)instanceIDWithHandler:(FIRInstanceIDResultHandler)handler;

/**
 *  Returns a Firebase Messaging scoped token for the firebase app.
 *
 *  @return Returns the stored token if the device has registered with Firebase Messaging, otherwise
 *          returns nil.
 */
- (nullable NSString *)token __deprecated_msg("Use instanceIDWithHandler: instead.");

/**
 *  Returns a token that authorizes an Entity (example: cloud service) to perform
 *  an action on behalf of the application identified by Instance ID.
 *
 *  This is similar to an OAuth2 token except, it applies to the
 *  application instance instead of a user.
 *
 *  This is an asynchronous call. If the token fetching fails for some reason
 *  we invoke the completion callback with nil `token` and the appropriate
 *  error.
 *
 *  This generates an Instance ID if it does not exist yet, which starts periodically sending
 *  information to the Firebase backend (see `[FIRInstanceID getIDWithHandler:]`).
 *
 *  Note, you can only have one `token` or `deleteToken` call for a given
 *  authorizedEntity and scope at any point of time. Making another such call with the
 *  same authorizedEntity and scope before the last one finishes will result in an
 *  error with code `OperationInProgress`.
 *
 *  @see FIRInstanceID deleteTokenWithAuthorizedEntity:scope:handler:
 *
 *  @param authorizedEntity Entity authorized by the token.
 *  @param scope            Action authorized for authorizedEntity.
 *  @param options          The extra options to be sent with your token request. The
 *                          value for the `apns_token` should be the NSData object
 *                          passed to the UIApplicationDelegate's
 *                          `didRegisterForRemoteNotificationsWithDeviceToken` method.
 *                          The value for `apns_sandbox` should be a boolean (or an
 *                          NSNumber representing a BOOL in Objective C) set to true if
 *                          your app is a debug build, which means that the APNs
 *                          device token is for the sandbox environment. It should be
 *                          set to false otherwise. If the `apns_sandbox` key is not
 *                          provided, an automatically-detected value shall be used.
 *  @param handler          The callback handler which is invoked when the token is
 *                          successfully fetched. In case of success a valid `token` and
 *                          `nil` error are returned. In case of any error the `token`
 *                          is nil and a valid `error` is returned. The valid error
 *                          codes have been documented above.
 */
- (void)tokenWithAuthorizedEntity:(NSString *)authorizedEntity
                            scope:(NSString *)scope
                          options:(nullable NSDictionary *)options
                          handler:(FIRInstanceIDTokenHandler)handler;

/**
 *  Revokes access to a scope (action) for an entity previously
 *  authorized by `[FIRInstanceID tokenWithAuthorizedEntity:scope:options:handler]`.
 *
 *  This is an asynchronous call. Call this on the main thread since InstanceID lib
 *  is not thread safe. In case token deletion fails for some reason we invoke the
 *  `handler` callback passed in with the appropriate error code.
 *
 *  Note, you can only have one `token` or `deleteToken` call for a given
 *  authorizedEntity and scope at a point of time. Making another such call with the
 *  same authorizedEntity and scope before the last one finishes will result in an error
 *  with code `OperationInProgress`.
 *
 *  @param authorizedEntity Entity that must no longer have access.
 *  @param scope            Action that entity is no longer authorized to perform.
 *  @param handler          The handler that is invoked once the unsubscribe call ends.
 *                          In case of error an appropriate error object is returned
 *                          else error is nil.
 */
- (void)deleteTokenWithAuthorizedEntity:(NSString *)authorizedEntity
                                  scope:(NSString *)scope
                                handler:(FIRInstanceIDDeleteTokenHandler)handler;

#pragma mark - Identity

/**
 *  Asynchronously fetch a stable identifier that uniquely identifies the app
 *  instance. If the identifier has been revoked or has expired, this method will
 *  return a new identifier.
 *
 *  Once an InstanceID is generated, the library periodically sends information about the
 *  application and the device where it's running to the Firebase backend. To stop this. see
 *  `[FIRInstanceID deleteIDWithHandler:]`.
 *
 *  @param handler The handler to invoke once the identifier has been fetched.
 *                 In case of error an appropriate error object is returned else
 *                 a valid identifier is returned and a valid identifier for the
 *                 application instance.
 */
- (void)getIDWithHandler:(FIRInstanceIDHandler)handler NS_SWIFT_NAME(getID(handler:));

/**
 *  Resets Instance ID and revokes all tokens.
 *
 *  This method also triggers a request to fetch a new Instance ID and Firebase Messaging scope
 *  token. Please listen to kFIRInstanceIDTokenRefreshNotification when the new ID and token are
 *  ready.
 *
 *  This stops the periodic sending of data to the Firebase backend that began when the Instance ID
 *  was generated. No more data is sent until another library calls Instance ID internally again
 *  (like FCM, RemoteConfig or Analytics) or user explicitly calls Instance ID APIs to get an
 *  Instance ID and token again.
 */
- (void)deleteIDWithHandler:(FIRInstanceIDDeleteHandler)handler NS_SWIFT_NAME(deleteID(handler:));

@end

NS_ASSUME_NONNULL_END

// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
//
// You are hereby granted a non-exclusive, worldwide, royalty-free license to use,
// copy, modify, and distribute this software in source code or binary form for use
// in connection with the web services and APIs provided by Facebook.
//
// As with any software that integrates with the Facebook platform, your use of
// this software is subject to the Facebook Developer Principles and Policies
// [http://developers.facebook.com/policy/]. This copyright notice shall be
// included in all copies or substantial portions of the software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

#import <UIKit/UIKit.h>

#import "FBSDKLoginConfiguration.h"

NS_ASSUME_NONNULL_BEGIN

#if TARGET_OS_TV

// This is an unfortunate hack for Swift Package Manager support.
// SPM does not allow us to conditionally exclude Swift files for compilation by platform.
//
// So to support tvOS with SPM we need to use runtime availability checks in the Swift files.
// This means that even though the code in `LoginManager.swift` will never be run for tvOS
// targets, it still needs to be able to compile. Hence we need to declare it here.
//
// The way to fix this is to remove extensions of ObjC types in Swift.

@class LoginManagerLoginResult;
@class FBSDKLoginConfiguration;

typedef NS_ENUM(NSUInteger, LoginBehavior) { LoginBehaviorBrowser };
typedef NS_ENUM(NSUInteger, DefaultAudience) { DefaultAudienceFriends };

typedef void (^LoginManagerLoginResultBlock)(LoginManagerLoginResult *_Nullable result,
                                             NSError *_Nullable error);

@interface LoginManager : NSObject

@property (assign, nonatomic) LoginBehavior loginBehavior;
@property (assign, nonatomic) DefaultAudience defaultAudience;

- (void)logInWithPermissions:(NSArray<NSString *> *)permissions
              fromViewController:(nullable UIViewController *)fromViewController
                         handler:(nullable LoginManagerLoginResultBlock)handler
NS_SWIFT_NAME(logIn(permissions:from:handler:));

- (void)logInFromViewController:(nullable UIViewController *)viewController
                  configuration:(FBSDKLoginConfiguration *)configuration
                     completion:(LoginManagerLoginResultBlock)completion
NS_REFINED_FOR_SWIFT;

@end

#else

@class FBSDKLoginManagerLoginResult;

/// typedef for FBSDKLoginAuthType
typedef NSString *const FBSDKLoginAuthType NS_TYPED_EXTENSIBLE_ENUM NS_SWIFT_NAME(LoginAuthType);

/// Rerequest
FOUNDATION_EXPORT FBSDKLoginAuthType FBSDKLoginAuthTypeRerequest;

/// Reauthorize
FOUNDATION_EXPORT FBSDKLoginAuthType FBSDKLoginAuthTypeReauthorize;

/**
  Describes the call back to the FBSDKLoginManager
 @param result the result of the authorization
 @param error the authorization error, if any.
 */
typedef void (^FBSDKLoginManagerLoginResultBlock)(FBSDKLoginManagerLoginResult *_Nullable result,
                                                  NSError *_Nullable error)
NS_SWIFT_NAME(LoginManagerLoginResultBlock);


/**
 FBSDKDefaultAudience enum

  Passed to openURL to indicate which default audience to use for sessions that post data to Facebook.

 Certain operations such as publishing a status or publishing a photo require an audience. When the user
 grants an application permission to perform a publish operation, a default audience is selected as the
 publication ceiling for the application. This enumerated value allows the application to select which
 audience to ask the user to grant publish permission for.
 */
typedef NS_ENUM(NSUInteger, FBSDKDefaultAudience)
{
  /** Indicates that the user's friends are able to see posts made by the application */
  FBSDKDefaultAudienceFriends = 0,
  /** Indicates that only the user is able to see posts made by the application */
  FBSDKDefaultAudienceOnlyMe,
  /** Indicates that all Facebook users are able to see posts made by the application */
  FBSDKDefaultAudienceEveryone,
} NS_SWIFT_NAME(DefaultAudience);

/**
  `FBSDKLoginManager` provides methods for logging the user in and out.

 `FBSDKLoginManager` serves to help manage sessions represented by tokens for authentication,
 `AuthenticationToken`, and data access, `AccessToken`.

 You should check if the type of token you expect is present as a singleton instance, either `AccessToken.current`
 or `AuthenticationToken.current` before calling any of the login methods to see if there is a cached token
 available. A standard place to do this is in `viewDidLoad`.

 @warning If you are managing your own token instances outside of `AccessToken.current`, you will need to set
 `AccessToken.current` before calling any of the login methods to authorize further permissions on your tokens.
 */
NS_SWIFT_NAME(LoginManager)
@interface FBSDKLoginManager : NSObject

/**
 Auth type
 */
@property (strong, nonatomic) FBSDKLoginAuthType authType;
/**
  the default audience.

 you should set this if you intend to ask for publish permissions.
 */
@property (assign, nonatomic) FBSDKDefaultAudience defaultAudience;

/**
 Logs the user in or authorizes additional permissions.

 @param permissions the optional array of permissions. Note this is converted to NSSet and is only
 an NSArray for the convenience of literal syntax.
 @param fromViewController the view controller to present from. If nil, the topmost view controller will be
 automatically determined as best as possible.
 @param handler the callback.

 Use this method when asking for read permissions. You should only ask for permissions when they
 are needed and explain the value to the user. You can inspect the `FBSDKLoginManagerLoginResultBlock`'s
 `result.declinedPermissions` to provide more information to the user if they decline permissions.
 You typically should check if `AccessToken.current` already contains the permissions you need before
 asking to reduce unnecessary login attempts. For example, you could perform that check in `viewDidLoad`.

 @warning You can only perform one login call at a time. Calling a login method before the completion handler is called
 on a previous login attempt will result in an error.
 @warning This method will present a UI to the user and thus should be called on the main thread.
 */
- (void)logInWithPermissions:(NSArray<NSString *> *)permissions
          fromViewController:(nullable UIViewController *)fromViewController
                     handler:(nullable FBSDKLoginManagerLoginResultBlock)handler
NS_SWIFT_NAME(logIn(permissions:from:handler:));

/**
 Logs the user in or authorizes additional permissions.

 @param viewController the view controller from which to present the login UI. If nil, the topmost view
 controller will be automatically determined and used.
 @param configuration the login configuration to use.
 @param completion the login completion handler.

 Use this method when asking for permissions. You should only ask for permissions when they
 are needed and the value should be explained to the user. You can inspect the
 `FBSDKLoginManagerLoginResultBlock`'s `result.declinedPermissions` to provide more information
 to the user if they decline permissions.
 To reduce unnecessary login attempts, you should typically check if `AccessToken.current`
 already contains the permissions you need. If it does, you probably do not need to call this method.

 @warning You can only perform one login call at a time. Calling a login method before the completion handler is called
 on a previous login attempt will result in an error.
 @warning This method will present a UI to the user and thus should be called on the main thread.
 */
- (void)logInFromViewController:(nullable UIViewController *)viewController
                  configuration:(FBSDKLoginConfiguration *)configuration
                     completion:(FBSDKLoginManagerLoginResultBlock)completion
NS_REFINED_FOR_SWIFT;

/**
 Logs the user in with the given deep link url. Will only log user in if the given url contains valid login data.
 @param url the deep link url
 @param handler the callback.

This method will present a UI to the user and thus should be called on the main thread.
This method should be called with the url from the openURL method.

 @warning This method will present a UI to the user and thus should be called on the main thread.
 */
- (void)logInWithURL:(NSURL *)url
             handler:(nullable FBSDKLoginManagerLoginResultBlock)handler
NS_SWIFT_NAME(logIn(url:handler:));

/**
 Requests user's permission to reathorize application's data access, after it has expired due to inactivity.
 @param fromViewController the view controller from which to present the login UI. If nil, the topmost view
 controller will be automatically determined and used.
 @param handler the callback.

Use this method when you need to reathorize your app's access to user data via the Graph API.
You should only call this after access has expired.
You should provide as much context to the user as possible as to why you need to reauthorize the access, the
scope of access being reathorized, and what added value your app provides when the access is reathorized.
You can inspect the `result.declinedPermissions` to determine if you should provide more information to the
user based on any declined permissions.

 @warning This method will reauthorize using a `LoginConfiguration` with `FBSDKLoginTracking` set to `.enabled`.
 @warning This method will present UI the user. You typically should call this if `AccessToken.isDataAccessExpired` is true.
 */
- (void)reauthorizeDataAccess:(UIViewController *)fromViewController
                      handler:(FBSDKLoginManagerLoginResultBlock)handler
NS_SWIFT_NAME(reauthorizeDataAccess(from:handler:));

/**
  Logs the user out

 This nils out the singleton instances of `AccessToken` `AuthenticationToken` and `Profle`.

 @note This is only a client side logout. It will not log the user out of their Facebook account.
 */
- (void)logOut;

@end

#endif

NS_ASSUME_NONNULL_END

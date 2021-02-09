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

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

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

  Passed to open to indicate which default audience to use for sessions that post data to Facebook.



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
 FBSDKLoginBehavior enum

  Passed to the \c FBSDKLoginManager to indicate how Facebook Login should be attempted.



 Facebook Login authorizes the application to act on behalf of the user, using the user's
 Facebook account. Usually a Facebook Login will rely on an account maintained outside of
 the application, by the native Facebook application, the browser, or perhaps the device
 itself. This avoids the need for a user to enter their username and password directly, and
 provides the most secure and lowest friction way for a user to authorize the application to
 interact with Facebook.

 The \c FBSDKLoginBehavior enum specifies which log-in methods may be used. The SDK
  will determine the best behavior based on the current device (such as iOS version).
 */
typedef NS_ENUM(NSUInteger, FBSDKLoginBehavior)
{
  /**
    This is the default behavior, and indicates logging in via ASWebAuthenticationSession (iOS 12+) or SFAuthenticationSession (iOS 11),
    which present specialized SafariViewControllers. Falls back to plain SFSafariViewController (iOS 9 and 10) or Safari (iOS 8).
   */
  FBSDKLoginBehaviorBrowser = 0,
} NS_SWIFT_NAME(LoginBehavior)
DEPRECATED_MSG_ATTRIBUTE("All login flows utilize the browser. This will be removed in the next major release");

/**
  `FBSDKLoginManager` provides methods for logging the user in and out.

 `FBSDKLoginManager` works directly with `[FBSDKAccessToken currentAccessToken]` and
  sets the "currentAccessToken" upon successful authorizations (or sets `nil` in case of `logOut`).

 You should check `[FBSDKAccessToken currentAccessToken]` before calling logIn* to see if there is
 a cached token available (typically in your viewDidLoad).

 If you are managing your own token instances outside of "currentAccessToken", you will need to set
 "currentAccessToken" before calling logIn* to authorize further permissions on your tokens.
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
  the login behavior
 */
@property (assign, nonatomic) FBSDKLoginBehavior loginBehavior
DEPRECATED_MSG_ATTRIBUTE("All login flows utilize the browser. This will be removed in the next major release");

/**
 Logs the user in or authorizes additional permissions.
 @param permissions the optional array of permissions. Note this is converted to NSSet and is only
 an NSArray for the convenience of literal syntax.
 @param fromViewController the view controller to present from. If nil, the topmost view controller will be
 automatically determined as best as possible.
 @param handler the callback.

 Use this method when asking for read permissions. You should only ask for permissions when they
 are needed and explain the value to the user. You can inspect the result.declinedPermissions to also
 provide more information to the user if they decline permissions.

 This method will present UI the user. You typically should check if `[FBSDKAccessToken currentAccessToken]`
 already contains the permissions you need before asking to reduce unnecessary app switching. For example,
 you could make that check at viewDidLoad.
 You can only do one login call at a time. Calling a login method before the completion handler is called
 on a previous login will return an error.
 */
- (void)logInWithPermissions:(NSArray<NSString *> *)permissions
              fromViewController:(nullable UIViewController *)fromViewController
                         handler:(nullable FBSDKLoginManagerLoginResultBlock)handler
NS_SWIFT_NAME(logIn(permissions:from:handler:));

/**
  Requests user's permission to reathorize application's data access, after it has expired due to inactivity.
 @param fromViewController the view controller to present from. If nil, the topmost view controller will be
 automatically determined as best as possible.
 @param handler the callback.
 Use this method when you need to reathorize your app's access to user data via Graph API, after such an access has expired.
 You should provide as much context to the user as possible as to why you need to reauthorize the access, the scope of
 access being reathorized, and what added value your app provides when the access is reathorized.
 You can inspect the result.declinedPermissions to also provide more information to the user if they decline permissions.
 This method will present UI the user. You typically should call this if `[FBSDKAccessToken isDataAccessExpired]` returns true.
 */
- (void)reauthorizeDataAccess:(UIViewController *)fromViewController
                      handler:(FBSDKLoginManagerLoginResultBlock)handler
NS_SWIFT_NAME(reauthorizeDataAccess(from:handler:));

/**
  Logs the user out

 This calls [FBSDKAccessToken setCurrentAccessToken:nil] and [FBSDKProfile setCurrentProfile:nil].
 */
- (void)logOut;

@end

NS_ASSUME_NONNULL_END

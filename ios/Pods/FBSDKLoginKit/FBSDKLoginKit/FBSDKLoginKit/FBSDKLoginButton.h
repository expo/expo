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

#import <FBSDKCoreKit/FBSDKButton.h>

#import <FBSDKLoginKit/FBSDKLoginManager.h>

#import "FBSDKTooltipView.h"

NS_ASSUME_NONNULL_BEGIN

@protocol FBSDKLoginButtonDelegate;

/**
 NS_ENUM(NSUInteger, FBSDKLoginButtonTooltipBehavior)
  Indicates the desired login tooltip behavior.
 */
typedef NS_ENUM(NSUInteger, FBSDKLoginButtonTooltipBehavior)
{
  /** The default behavior. The tooltip will only be displayed if
   the app is eligible (determined by possible server round trip) */
  FBSDKLoginButtonTooltipBehaviorAutomatic = 0,
  /** Force display of the tooltip (typically for UI testing) */
  FBSDKLoginButtonTooltipBehaviorForceDisplay = 1,
  /** Force disable. In this case you can still exert more refined
   control by manually constructing a `FBSDKLoginTooltipView` instance. */
  FBSDKLoginButtonTooltipBehaviorDisable = 2
} NS_SWIFT_NAME(FBLoginButton.TooltipBehavior);

/**
  A button that initiates a log in or log out flow upon tapping.

 `FBSDKLoginButton` works with `[FBSDKAccessToken currentAccessToken]` to
  determine what to display, and automatically starts authentication when tapped (i.e.,
  you do not need to manually subscribe action targets).

  Like `FBSDKLoginManager`, you should make sure your app delegate is connected to
  `FBSDKApplicationDelegate` in order for the button's delegate to receive messages.

 `FBSDKLoginButton` has a fixed height of @c 30 pixels, but you may change the width. `initWithFrame:CGRectZero`
 will size the button to its minimum frame.
*/
NS_SWIFT_NAME(FBLoginButton)
@interface FBSDKLoginButton : FBSDKButton

/**
  The default audience to use, if publish permissions are requested at login time.
 */
@property (assign, nonatomic) FBSDKDefaultAudience defaultAudience;
/**
  Gets or sets the delegate.
 */
@property (weak, nonatomic) IBOutlet id<FBSDKLoginButtonDelegate> delegate;
/**
  Gets or sets the login behavior to use
 */
@property (assign, nonatomic) FBSDKLoginBehavior loginBehavior;

/*!
 @abstract The permissions to request.
 @discussion To provide the best experience, you should minimize the number of permissions you request, and only ask for them when needed.
 For example, do not ask for "user_location" until you the information is actually used by the app.

 Note this is converted to NSSet and is only
 an NSArray for the convenience of literal syntax.

 See [the permissions guide]( https://developers.facebook.com/docs/facebook-login/permissions/ ) for more details.
 */
@property (copy, nonatomic) NSArray<NSString *> *permissions;
/**
  Gets or sets the desired tooltip behavior.
 */
@property (assign, nonatomic) FBSDKLoginButtonTooltipBehavior tooltipBehavior;
/**
  Gets or sets the desired tooltip color style.
 */
@property (assign, nonatomic) FBSDKTooltipColorStyle tooltipColorStyle;

@end

/**
 @protocol
  A delegate for `FBSDKLoginButton`
 */
NS_SWIFT_NAME(LoginButtonDelegate)
@protocol FBSDKLoginButtonDelegate <NSObject>

@required
/**
  Sent to the delegate when the button was used to login.
 @param loginButton the sender
 @param result The results of the login
 @param error The error (if any) from the login
 */
- (void)loginButton:(FBSDKLoginButton *)loginButton
didCompleteWithResult:(nullable FBSDKLoginManagerLoginResult *)result
                error:(nullable NSError *)error;

/**
  Sent to the delegate when the button was used to logout.
 @param loginButton The button that was clicked.
*/
- (void)loginButtonDidLogOut:(FBSDKLoginButton *)loginButton;

@optional
/**
  Sent to the delegate when the button is about to login.
 @param loginButton the sender
 @return YES if the login should be allowed to proceed, NO otherwise
 */
- (BOOL)loginButtonWillLogin:(FBSDKLoginButton *)loginButton;

@end

NS_ASSUME_NONNULL_END

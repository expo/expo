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

#import <FBSDKLoginKit/FBSDKTooltipView.h>

NS_ASSUME_NONNULL_BEGIN

@protocol FBSDKLoginTooltipViewDelegate;

/**

  Represents a tooltip to be displayed next to a Facebook login button
  to highlight features for new users.


 The `FBSDKLoginButton` may display this view automatically. If you do
  not use the `FBSDKLoginButton`, you can manually call one of the `present*` methods
  as appropriate and customize behavior via `FBSDKLoginTooltipViewDelegate` delegate.

  By default, the `FBSDKLoginTooltipView` is not added to the superview until it is
  determined the app has migrated to the new login experience. You can override this
  (e.g., to test the UI layout) by implementing the delegate or setting `forceDisplay` to YES.

 */
NS_SWIFT_NAME(FBLoginTooltipView)
@interface FBSDKLoginTooltipView : FBSDKTooltipView

/**  the delegate */
@property (nonatomic, weak) id<FBSDKLoginTooltipViewDelegate> delegate;

/**  if set to YES, the view will always be displayed and the delegate's
  `loginTooltipView:shouldAppear:` will NOT be called. */
@property (nonatomic, assign, getter=shouldForceDisplay) BOOL forceDisplay;

@end

/**
 @protocol

  The `FBSDKLoginTooltipViewDelegate` protocol defines the methods used to receive event
 notifications from `FBSDKLoginTooltipView` objects.
 */
NS_SWIFT_NAME(LoginTooltipViewDelegate)
@protocol FBSDKLoginTooltipViewDelegate <NSObject>

@optional

/**
  Asks the delegate if the tooltip view should appear

 @param view The tooltip view.
 @param appIsEligible The value fetched from the server identifying if the app
 is eligible for the new login experience.


 Use this method to customize display behavior.
 */
- (BOOL)loginTooltipView:(FBSDKLoginTooltipView *)view shouldAppear:(BOOL)appIsEligible;

/**
  Tells the delegate the tooltip view will appear, specifically after it's been
 added to the super view but before the fade in animation.

 @param view The tooltip view.
 */
- (void)loginTooltipViewWillAppear:(FBSDKLoginTooltipView *)view;

/**
  Tells the delegate the tooltip view will not appear (i.e., was not
 added to the super view).

 @param view The tooltip view.
 */
- (void)loginTooltipViewWillNotAppear:(FBSDKLoginTooltipView *)view;


@end

NS_ASSUME_NONNULL_END

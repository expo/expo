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

#import "FBSDKAppLinkNavigation.h"

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSUInteger, FBSDKIncludeStatusBarInSize) {
    FBSDKIncludeStatusBarInSizeNever,
    FBSDKIncludeStatusBarInSizeIOS7AndLater,
    FBSDKIncludeStatusBarInSizeAlways,
};

@class FBSDKAppLinkReturnToRefererView;
@class FBSDKURL;

/*!
 Protocol that a class can implement in order to be notified when the user has navigated back
 to the referer of an App Link.
 */
@protocol FBSDKAppLinkReturnToRefererViewDelegate <NSObject>

/*!
 Called when the user has tapped inside the close button.
 */
- (void)returnToRefererViewDidTapInsideCloseButton:(FBSDKAppLinkReturnToRefererView *)view;

/*!
 Called when the user has tapped inside the App Link portion of the view.
 */
- (void)returnToRefererViewDidTapInsideLink:(FBSDKAppLinkReturnToRefererView *)view
                                       link:(FBSDKAppLink *)link;

@end

/*!
 Provides a UIView that displays a button allowing users to navigate back to the
 application that launched the App Link currently being handled, if the App Link
 contained referer data. The user can also close the view by clicking a close button
 rather than navigating away. If the view is provided an App Link that does not contain
 referer data, it will have zero size and no UI will be displayed.
 */
NS_EXTENSION_UNAVAILABLE_IOS("Not available in app extension")
@interface FBSDKAppLinkReturnToRefererView : UIView

/*!
 The delegate that will be notified when the user navigates back to the referer.
 */
@property (nonatomic, weak, nullable) id<FBSDKAppLinkReturnToRefererViewDelegate> delegate;

/*!
 The color of the text label and close button.
 */
@property (nonatomic, strong) UIColor *textColor;

@property (nonatomic, strong) FBSDKAppLink *refererAppLink;

/*!
 Indicates whether to extend the size of the view to include the current status bar
 size, for use in scenarios where the view might extend under the status bar on iOS 7 and
 above; this property has no effect on earlier versions of iOS.
 */
@property (nonatomic, assign) FBSDKIncludeStatusBarInSize includeStatusBarInSize;

/*!
 Indicates whether the user has closed the view by clicking the close button.
 */
@property (nonatomic, assign) BOOL closed;

@end

NS_ASSUME_NONNULL_END

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

#import "FBSDKAppLinkReturnToRefererView.h"

NS_ASSUME_NONNULL_BEGIN

@class FBSDKAppLink;
@class FBSDKAppLinkReturnToRefererController;

/**
 Protocol that a class can implement in order to be notified when the user has navigated back
 to the referer of an App Link.
 */
NS_SWIFT_NAME(AppLinkReturnToRefererControllerDelegate)
@protocol FBSDKAppLinkReturnToRefererControllerDelegate <NSObject>

@optional

/** Called when the user has tapped to navigate, but before the navigation has been performed. */
- (void)returnToRefererController:(FBSDKAppLinkReturnToRefererController *)controller
            willNavigateToAppLink:(FBSDKAppLink *)appLink
NS_SWIFT_NAME(return(to:willNavigateTo:));

/** Called after the navigation has been attempted, with an indication of whether the referer
 app link was successfully opened. */
- (void)returnToRefererController:(FBSDKAppLinkReturnToRefererController *)controller
             didNavigateToAppLink:(FBSDKAppLink *)url
                             type:(FBSDKAppLinkNavigationType)type
NS_SWIFT_NAME(return(to:didNavigateTo:type:));

@end

/**
 A controller class that implements default behavior for a FBSDKAppLinkReturnToRefererView, including
 the ability to display the view above the navigation bar for navigation-based apps.
 */
NS_EXTENSION_UNAVAILABLE_IOS("Not available in app extension")
NS_SWIFT_NAME(AppLinkReturnToRefererController)
@interface FBSDKAppLinkReturnToRefererController : NSObject <FBSDKAppLinkReturnToRefererViewDelegate>

/**
 The delegate that will be notified when the user navigates back to the referer.
 */
@property (nonatomic, weak, nullable) id<FBSDKAppLinkReturnToRefererControllerDelegate> delegate;

/**
 The FBSDKAppLinkReturnToRefererView this controller is controlling.
 */
@property (nonatomic, strong) FBSDKAppLinkReturnToRefererView *view;

/**
 Initializes a controller suitable for controlling a FBSDKAppLinkReturnToRefererView that is to be displayed
 contained within another UIView (i.e., not displayed above the navigation bar).
 */
- (instancetype)init NS_DESIGNATED_INITIALIZER;

/**
 Initializes a controller suitable for controlling a FBSDKAppLinkReturnToRefererView that is to be displayed
 displayed above the navigation bar.

 @param navController The Navigation Controller for display above
 */
- (instancetype)initForDisplayAboveNavController:(UINavigationController *)navController
NS_SWIFT_NAME(init(navController:));

/**
 Removes the view entirely from the navigation controller it is currently displayed in.
 */
- (void)removeFromNavController;

/**
 Shows the FBSDKAppLinkReturnToRefererView with the specified referer information. If nil or missing data,
 the view will not be displayed. */
- (void)showViewForRefererAppLink:(FBSDKAppLink *)refererAppLink
NS_SWIFT_NAME(showView(forReferer:));

/**
 Shows the FBSDKAppLinkReturnToRefererView with referer information extracted from the specified URL.
 If nil or missing referer App Link data, the view will not be displayed. */
- (void)showViewForRefererURL:(NSURL *)url
NS_SWIFT_NAME(showView(forReferer:));

/**
 Closes the view, possibly animating it.
 */
- (void)closeViewAnimated:(BOOL)animated;

@end

NS_ASSUME_NONNULL_END

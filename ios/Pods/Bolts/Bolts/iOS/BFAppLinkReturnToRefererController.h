/*
 *  Copyright (c) 2014, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import <Bolts/BFAppLinkReturnToRefererView.h>

@class BFAppLink;
@class BFAppLinkReturnToRefererController;

/*!
 Protocol that a class can implement in order to be notified when the user has navigated back
 to the referer of an App Link.
 */
@protocol BFAppLinkReturnToRefererControllerDelegate <NSObject>

@optional

/*! Called when the user has tapped to navigate, but before the navigation has been performed. */
- (void)returnToRefererController:(BFAppLinkReturnToRefererController *)controller
            willNavigateToAppLink:(BFAppLink *)appLink;

/*! Called after the navigation has been attempted, with an indication of whether the referer
 app link was successfully opened. */
- (void)returnToRefererController:(BFAppLinkReturnToRefererController *)controller
             didNavigateToAppLink:(BFAppLink *)url
                             type:(BFAppLinkNavigationType)type;

@end

/*!
 A controller class that implements default behavior for a BFAppLinkReturnToRefererView, including
 the ability to display the view above the navigation bar for navigation-based apps.
 */
NS_EXTENSION_UNAVAILABLE_IOS("Not available in app extension")
@interface BFAppLinkReturnToRefererController : NSObject <BFAppLinkReturnToRefererViewDelegate>

/*!
 The delegate that will be notified when the user navigates back to the referer.
 */
@property (nonatomic, weak) id<BFAppLinkReturnToRefererControllerDelegate> delegate;

/*!
 The BFAppLinkReturnToRefererView this controller is controlling.
 */
@property (nonatomic, strong) BFAppLinkReturnToRefererView *view;

/*!
 Initializes a controller suitable for controlling a BFAppLinkReturnToRefererView that is to be displayed
 contained within another UIView (i.e., not displayed above the navigation bar).
 */
- (instancetype)init;

/*!
 Initializes a controller suitable for controlling a BFAppLinkReturnToRefererView that is to be displayed
 displayed above the navigation bar.
 */
- (instancetype)initForDisplayAboveNavController:(UINavigationController *)navController;

/*!
 Removes the view entirely from the navigation controller it is currently displayed in.
 */
- (void)removeFromNavController;

/*!
 Shows the BFAppLinkReturnToRefererView with the specified referer information. If nil or missing data,
 the view will not be displayed. */
- (void)showViewForRefererAppLink:(BFAppLink *)refererAppLink;

/*!
 Shows the BFAppLinkReturnToRefererView with referer information extracted from the specified URL.
 If nil or missing referer App Link data, the view will not be displayed. */
- (void)showViewForRefererURL:(NSURL *)url;

/*!
 Closes the view, possibly animating it.
 */
- (void)closeViewAnimated:(BOOL)animated;

@end

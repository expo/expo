/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

@class ABI5_0_0RCTShadowView;

#import "ABI5_0_0RCTComponent.h"

//TODO: let's try to eliminate this category if possible

@interface UIView (ReactABI5_0_0) <ABI5_0_0RCTComponent>

- (NSArray<UIView *> *)ReactABI5_0_0Subviews;
- (UIView *)ReactABI5_0_0Superview;

/**
 * Used by the UIIManager to set the view frame.
 * May be overriden to disable animation, etc.
 */
- (void)ReactABI5_0_0SetFrame:(CGRect)frame;

/**
 * Used to improve performance when compositing views with translucent content.
 */
- (void)ReactABI5_0_0SetInheritedBackgroundColor:(UIColor *)inheritedBackgroundColor;

/**
 * This method finds and returns the containing view controller for the view.
 */
- (UIViewController *)ReactABI5_0_0ViewController;

/**
 * This method attaches the specified controller as a child of the
 * the owning view controller of this view. Returns NO if no view
 * controller is found (which may happen if the view is not currently
 * attached to the view hierarchy).
 */
- (void)ReactABI5_0_0AddControllerToClosestParent:(UIViewController *)controller;

/**
 * Responder overrides - to be deprecated.
 */
- (void)ReactABI5_0_0WillMakeFirstResponder;
- (void)ReactABI5_0_0DidMakeFirstResponder;
- (BOOL)ReactABI5_0_0RespondsToTouch:(UITouch *)touch;

/**
 Tools for debugging
 */
#if ABI5_0_0RCT_DEV
@property (nonatomic, strong, setter=_DEBUG_setReactABI5_0_0ShadowView:) ABI5_0_0RCTShadowView *_DEBUG_ReactABI5_0_0ShadowView;
#endif

@end

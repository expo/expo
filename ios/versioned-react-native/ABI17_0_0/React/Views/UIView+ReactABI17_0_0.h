/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import <ReactABI17_0_0/ABI17_0_0RCTComponent.h>

@class ABI17_0_0RCTShadowView;

@interface UIView (ReactABI17_0_0) <ABI17_0_0RCTComponent>

/**
 * ABI17_0_0RCTComponent interface.
 */
- (NSArray<UIView *> *)ReactABI17_0_0Subviews NS_REQUIRES_SUPER;
- (UIView *)ReactABI17_0_0Superview NS_REQUIRES_SUPER;
- (void)insertReactABI17_0_0Subview:(UIView *)subview atIndex:(NSInteger)atIndex NS_REQUIRES_SUPER;
- (void)removeReactABI17_0_0Subview:(UIView *)subview NS_REQUIRES_SUPER;

/**
 * Layout direction of the view.
 * Internally backed to `semanticContentAttribute` property.
 * Defaults to `LeftToRight` in case of ambiguity.
 */
@property (nonatomic, assign) UIUserInterfaceLayoutDirection ReactABI17_0_0LayoutDirection;

/**
 * Updates the subviews array based on the ReactABI17_0_0Subviews. Default behavior is
 * to insert the sortedReactABI17_0_0Subviews into the UIView.
 */
- (void)didUpdateReactABI17_0_0Subviews;

/**
 * Used by the UIIManager to set the view frame.
 * May be overriden to disable animation, etc.
 */
- (void)ReactABI17_0_0SetFrame:(CGRect)frame;

/**
 * Used to improve performance when compositing views with translucent content.
 */
- (void)ReactABI17_0_0SetInheritedBackgroundColor:(UIColor *)inheritedBackgroundColor;

/**
 * This method finds and returns the containing view controller for the view.
 */
- (UIViewController *)ReactABI17_0_0ViewController;

/**
 * This method attaches the specified controller as a child of the
 * the owning view controller of this view. Returns NO if no view
 * controller is found (which may happen if the view is not currently
 * attached to the view hierarchy).
 */
- (void)ReactABI17_0_0AddControllerToClosestParent:(UIViewController *)controller;

/**
 * Responder overrides - to be deprecated.
 */
- (void)ReactABI17_0_0WillMakeFirstResponder;
- (void)ReactABI17_0_0DidMakeFirstResponder;
- (BOOL)ReactABI17_0_0RespondsToTouch:(UITouch *)touch;

#if ABI17_0_0RCT_DEV

/**
 Tools for debugging
 */

@property (nonatomic, strong, setter=_DEBUG_setReactABI17_0_0ShadowView:) ABI17_0_0RCTShadowView *_DEBUG_ReactABI17_0_0ShadowView;

#endif

@end

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "UIView+ReactABI7_0_0.h"

#import <objc/runtime.h>

#import "ABI7_0_0RCTAssert.h"
#import "ABI7_0_0RCTLog.h"
#import "ABI7_0_0RCTShadowView.h"

@implementation UIView (ReactABI7_0_0)

- (NSNumber *)ReactABI7_0_0Tag
{
  return objc_getAssociatedObject(self, _cmd);
}

- (void)setReactABI7_0_0Tag:(NSNumber *)ReactABI7_0_0Tag
{
  objc_setAssociatedObject(self, @selector(ReactABI7_0_0Tag), ReactABI7_0_0Tag, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

#if ABI7_0_0RCT_DEV

- (ABI7_0_0RCTShadowView *)_DEBUG_ReactABI7_0_0ShadowView
{
  return objc_getAssociatedObject(self, _cmd);
}

- (void)_DEBUG_setReactABI7_0_0ShadowView:(ABI7_0_0RCTShadowView *)shadowView
{
  // Use assign to avoid keeping the shadowView alive it if no longer exists
  objc_setAssociatedObject(self, @selector(_DEBUG_ReactABI7_0_0ShadowView), shadowView, OBJC_ASSOCIATION_ASSIGN);
}

#endif

- (BOOL)isReactABI7_0_0RootView
{
  return ABI7_0_0RCTIsReactABI7_0_0RootView(self.ReactABI7_0_0Tag);
}

- (NSNumber *)ReactABI7_0_0TagAtPoint:(CGPoint)point
{
  UIView *view = [self hitTest:point withEvent:nil];
  while (view && !view.ReactABI7_0_0Tag) {
    view = view.superview;
  }
  return view.ReactABI7_0_0Tag;
}

- (void)insertReactABI7_0_0Subview:(UIView *)subview atIndex:(NSInteger)atIndex
{
  [self insertSubview:subview atIndex:atIndex];
}

- (void)removeReactABI7_0_0Subview:(UIView *)subview
{
  ABI7_0_0RCTAssert(subview.superview == self, @"%@ is a not a subview of %@", subview, self);
  [subview removeFromSuperview];
}

- (NSArray<UIView *> *)ReactABI7_0_0Subviews
{
  return self.subviews;
}

- (UIView *)ReactABI7_0_0Superview
{
  return self.superview;
}

- (void)ReactABI7_0_0SetFrame:(CGRect)frame
{
  // These frames are in terms of anchorPoint = topLeft, but internally the
  // views are anchorPoint = center for easier scale and rotation animations.
  // Convert the frame so it works with anchorPoint = center.
  CGPoint position = {CGRectGetMidX(frame), CGRectGetMidY(frame)};
  CGRect bounds = {CGPointZero, frame.size};

  // Avoid crashes due to nan coords
  if (isnan(position.x) || isnan(position.y) ||
      isnan(bounds.origin.x) || isnan(bounds.origin.y) ||
      isnan(bounds.size.width) || isnan(bounds.size.height)) {
    ABI7_0_0RCTLogError(@"Invalid layout for (%@)%@. position: %@. bounds: %@",
                self.ReactABI7_0_0Tag, self, NSStringFromCGPoint(position), NSStringFromCGRect(bounds));
    return;
  }

  self.center = position;
  self.bounds = bounds;
}

- (void)ReactABI7_0_0SetInheritedBackgroundColor:(__unused UIColor *)inheritedBackgroundColor
{
  // Does nothing by default
}

- (UIViewController *)ReactABI7_0_0ViewController
{
  id responder = [self nextResponder];
  while (responder) {
    if ([responder isKindOfClass:[UIViewController class]]) {
      return responder;
    }
    responder = [responder nextResponder];
  }
  return nil;
}

- (void)ReactABI7_0_0AddControllerToClosestParent:(UIViewController *)controller
{
  if (!controller.parentViewController) {
    UIView *parentView = (UIView *)self.ReactABI7_0_0Superview;
    while (parentView) {
      if (parentView.ReactABI7_0_0ViewController) {
        [parentView.ReactABI7_0_0ViewController addChildViewController:controller];
        [controller didMoveToParentViewController:parentView.ReactABI7_0_0ViewController];
        break;
      }
      parentView = (UIView *)parentView.ReactABI7_0_0Superview;
    }
    return;
  }
}

/**
 * Responder overrides - to be deprecated.
 */
- (void)ReactABI7_0_0WillMakeFirstResponder {};
- (void)ReactABI7_0_0DidMakeFirstResponder {};
- (BOOL)ReactABI7_0_0RespondsToTouch:(__unused UITouch *)touch
{
  return YES;
}

@end

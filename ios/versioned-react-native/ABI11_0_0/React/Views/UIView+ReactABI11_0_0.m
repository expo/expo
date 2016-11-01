/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "UIView+ReactABI11_0_0.h"

#import <objc/runtime.h>

#import "ABI11_0_0RCTAssert.h"
#import "ABI11_0_0RCTLog.h"
#import "ABI11_0_0RCTShadowView.h"

@implementation UIView (ReactABI11_0_0)

- (NSNumber *)ReactABI11_0_0Tag
{
  return objc_getAssociatedObject(self, _cmd);
}

- (void)setReactABI11_0_0Tag:(NSNumber *)ReactABI11_0_0Tag
{
  objc_setAssociatedObject(self, @selector(ReactABI11_0_0Tag), ReactABI11_0_0Tag, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

#if ABI11_0_0RCT_DEV

- (ABI11_0_0RCTShadowView *)_DEBUG_ReactABI11_0_0ShadowView
{
  return objc_getAssociatedObject(self, _cmd);
}

- (void)_DEBUG_setReactABI11_0_0ShadowView:(ABI11_0_0RCTShadowView *)shadowView
{
  // Use assign to avoid keeping the shadowView alive it if no longer exists
  objc_setAssociatedObject(self, @selector(_DEBUG_ReactABI11_0_0ShadowView), shadowView, OBJC_ASSOCIATION_ASSIGN);
}

#endif

- (BOOL)isReactABI11_0_0RootView
{
  return ABI11_0_0RCTIsReactABI11_0_0RootView(self.ReactABI11_0_0Tag);
}

- (NSNumber *)ReactABI11_0_0TagAtPoint:(CGPoint)point
{
  UIView *view = [self hitTest:point withEvent:nil];
  while (view && !view.ReactABI11_0_0Tag) {
    view = view.superview;
  }
  return view.ReactABI11_0_0Tag;
}

- (NSArray<UIView *> *)ReactABI11_0_0Subviews
{
  return objc_getAssociatedObject(self, _cmd);
}

- (UIView *)ReactABI11_0_0Superview
{
  return self.superview;
}

- (void)insertReactABI11_0_0Subview:(UIView *)subview atIndex:(NSInteger)atIndex
{
  // We access the associated object directly here in case someone overrides
  // the `ReactABI11_0_0Subviews` getter method and returns an immutable array.
  NSMutableArray *subviews = objc_getAssociatedObject(self, @selector(ReactABI11_0_0Subviews));
  if (!subviews) {
    subviews = [NSMutableArray new];
    objc_setAssociatedObject(self, @selector(ReactABI11_0_0Subviews), subviews, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
  }
  [subviews insertObject:subview atIndex:atIndex];
}

- (void)removeReactABI11_0_0Subview:(UIView *)subview
{
  // We access the associated object directly here in case someone overrides
  // the `ReactABI11_0_0Subviews` getter method and returns an immutable array.
  NSMutableArray *subviews = objc_getAssociatedObject(self, @selector(ReactABI11_0_0Subviews));
  [subviews removeObject:subview];
  [subview removeFromSuperview];
}

- (NSInteger)ReactABI11_0_0ZIndex
{
  return [objc_getAssociatedObject(self, _cmd) integerValue];
}

- (void)setReactABI11_0_0ZIndex:(NSInteger)ReactABI11_0_0ZIndex
{
  objc_setAssociatedObject(self, @selector(ReactABI11_0_0ZIndex), @(ReactABI11_0_0ZIndex), OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

- (NSArray<UIView *> *)sortedReactABI11_0_0Subviews
{
  NSArray *subviews = objc_getAssociatedObject(self, _cmd);
  if (!subviews) {
    // Check if sorting is required - in most cases it won't be
    BOOL sortingRequired = NO;
    for (UIView *subview in self.ReactABI11_0_0Subviews) {
      if (subview.ReactABI11_0_0ZIndex != 0) {
        sortingRequired = YES;
        break;
      }
    }
    subviews = sortingRequired ? [self.ReactABI11_0_0Subviews sortedArrayUsingComparator:^NSComparisonResult(UIView *a, UIView *b) {
      if (a.ReactABI11_0_0ZIndex > b.ReactABI11_0_0ZIndex) {
        return NSOrderedDescending;
      } else {
        // ensure sorting is stable by treating equal zIndex as ascending so
        // that original order is preserved
        return NSOrderedAscending;
      }
    }] : self.ReactABI11_0_0Subviews;
    objc_setAssociatedObject(self, _cmd, subviews, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
  }
  return subviews;
}

// private method, used to reset sort
- (void)clearSortedSubviews
{
  objc_setAssociatedObject(self, @selector(sortedReactABI11_0_0Subviews), nil, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

- (void)didUpdateReactABI11_0_0Subviews
{
  for (UIView *subview in self.sortedReactABI11_0_0Subviews) {
    [self addSubview:subview];
  }
}

- (void)ReactABI11_0_0SetFrame:(CGRect)frame
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
    ABI11_0_0RCTLogError(@"Invalid layout for (%@)%@. position: %@. bounds: %@",
                self.ReactABI11_0_0Tag, self, NSStringFromCGPoint(position), NSStringFromCGRect(bounds));
    return;
  }

  self.center = position;
  self.bounds = bounds;
}

- (void)ReactABI11_0_0SetInheritedBackgroundColor:(__unused UIColor *)inheritedBackgroundColor
{
  // Does nothing by default
}

- (UIViewController *)ReactABI11_0_0ViewController
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

- (void)ReactABI11_0_0AddControllerToClosestParent:(UIViewController *)controller
{
  if (!controller.parentViewController) {
    UIView *parentView = (UIView *)self.ReactABI11_0_0Superview;
    while (parentView) {
      if (parentView.ReactABI11_0_0ViewController) {
        [parentView.ReactABI11_0_0ViewController addChildViewController:controller];
        [controller didMoveToParentViewController:parentView.ReactABI11_0_0ViewController];
        break;
      }
      parentView = (UIView *)parentView.ReactABI11_0_0Superview;
    }
    return;
  }
}

/**
 * Responder overrides - to be deprecated.
 */
- (void)ReactABI11_0_0WillMakeFirstResponder {};
- (void)ReactABI11_0_0DidMakeFirstResponder {};
- (BOOL)ReactABI11_0_0RespondsToTouch:(__unused UITouch *)touch
{
  return YES;
}

@end

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "UIView+ReactABI17_0_0.h"

#import <objc/runtime.h>

#import "ABI17_0_0RCTAssert.h"
#import "ABI17_0_0RCTLog.h"
#import "ABI17_0_0RCTShadowView.h"

@implementation UIView (ReactABI17_0_0)

- (NSNumber *)ReactABI17_0_0Tag
{
  return objc_getAssociatedObject(self, _cmd);
}

- (void)setReactABI17_0_0Tag:(NSNumber *)ReactABI17_0_0Tag
{
  objc_setAssociatedObject(self, @selector(ReactABI17_0_0Tag), ReactABI17_0_0Tag, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

#if ABI17_0_0RCT_DEV

- (ABI17_0_0RCTShadowView *)_DEBUG_ReactABI17_0_0ShadowView
{
  return objc_getAssociatedObject(self, _cmd);
}

- (void)_DEBUG_setReactABI17_0_0ShadowView:(ABI17_0_0RCTShadowView *)shadowView
{
  // Use assign to avoid keeping the shadowView alive it if no longer exists
  objc_setAssociatedObject(self, @selector(_DEBUG_ReactABI17_0_0ShadowView), shadowView, OBJC_ASSOCIATION_ASSIGN);
}

#endif

- (BOOL)isReactABI17_0_0RootView
{
  return ABI17_0_0RCTIsReactABI17_0_0RootView(self.ReactABI17_0_0Tag);
}

- (NSNumber *)ReactABI17_0_0TagAtPoint:(CGPoint)point
{
  UIView *view = [self hitTest:point withEvent:nil];
  while (view && !view.ReactABI17_0_0Tag) {
    view = view.superview;
  }
  return view.ReactABI17_0_0Tag;
}

- (NSArray<UIView *> *)ReactABI17_0_0Subviews
{
  return objc_getAssociatedObject(self, _cmd);
}

- (UIView *)ReactABI17_0_0Superview
{
  return self.superview;
}

- (void)insertReactABI17_0_0Subview:(UIView *)subview atIndex:(NSInteger)atIndex
{
  // We access the associated object directly here in case someone overrides
  // the `ReactABI17_0_0Subviews` getter method and returns an immutable array.
  NSMutableArray *subviews = objc_getAssociatedObject(self, @selector(ReactABI17_0_0Subviews));
  if (!subviews) {
    subviews = [NSMutableArray new];
    objc_setAssociatedObject(self, @selector(ReactABI17_0_0Subviews), subviews, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
  }
  [subviews insertObject:subview atIndex:atIndex];
}

- (void)removeReactABI17_0_0Subview:(UIView *)subview
{
  // We access the associated object directly here in case someone overrides
  // the `ReactABI17_0_0Subviews` getter method and returns an immutable array.
  NSMutableArray *subviews = objc_getAssociatedObject(self, @selector(ReactABI17_0_0Subviews));
  [subviews removeObject:subview];
  [subview removeFromSuperview];
}

- (UIUserInterfaceLayoutDirection)ReactABI17_0_0LayoutDirection
{
  if ([self respondsToSelector:@selector(semanticContentAttribute)]) {
    return [UIView userInterfaceLayoutDirectionForSemanticContentAttribute:self.semanticContentAttribute];
  } else {
    return [objc_getAssociatedObject(self, @selector(ReactABI17_0_0LayoutDirection)) integerValue];
  }
}

- (void)setReactABI17_0_0LayoutDirection:(UIUserInterfaceLayoutDirection)layoutDirection
{
  if ([self respondsToSelector:@selector(setSemanticContentAttribute:)]) {
    self.semanticContentAttribute =
      layoutDirection == UIUserInterfaceLayoutDirectionLeftToRight ?
        UISemanticContentAttributeForceLeftToRight :
        UISemanticContentAttributeForceRightToLeft;
  } else {
    objc_setAssociatedObject(self, @selector(ReactABI17_0_0LayoutDirection), @(layoutDirection), OBJC_ASSOCIATION_RETAIN_NONATOMIC);
  }
}

- (void)didUpdateReactABI17_0_0Subviews
{
  for (UIView *subview in self.ReactABI17_0_0Subviews) {
    [self addSubview:subview];
  }
}

- (void)ReactABI17_0_0SetFrame:(CGRect)frame
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
    ABI17_0_0RCTLogError(@"Invalid layout for (%@)%@. position: %@. bounds: %@",
                self.ReactABI17_0_0Tag, self, NSStringFromCGPoint(position), NSStringFromCGRect(bounds));
    return;
  }

  self.center = position;
  self.bounds = bounds;
}

- (void)ReactABI17_0_0SetInheritedBackgroundColor:(__unused UIColor *)inheritedBackgroundColor
{
  // Does nothing by default
}

- (UIViewController *)ReactABI17_0_0ViewController
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

- (void)ReactABI17_0_0AddControllerToClosestParent:(UIViewController *)controller
{
  if (!controller.parentViewController) {
    UIView *parentView = (UIView *)self.ReactABI17_0_0Superview;
    while (parentView) {
      if (parentView.ReactABI17_0_0ViewController) {
        [parentView.ReactABI17_0_0ViewController addChildViewController:controller];
        [controller didMoveToParentViewController:parentView.ReactABI17_0_0ViewController];
        break;
      }
      parentView = (UIView *)parentView.ReactABI17_0_0Superview;
    }
    return;
  }
}

/**
 * Responder overrides - to be deprecated.
 */
- (void)ReactABI17_0_0WillMakeFirstResponder {};
- (void)ReactABI17_0_0DidMakeFirstResponder {};
- (BOOL)ReactABI17_0_0RespondsToTouch:(__unused UITouch *)touch
{
  return YES;
}

@end

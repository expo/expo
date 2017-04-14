/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "UIView+ReactABI16_0_0.h"

#import <objc/runtime.h>

#import "ABI16_0_0RCTAssert.h"
#import "ABI16_0_0RCTLog.h"
#import "ABI16_0_0RCTShadowView.h"

@implementation UIView (ReactABI16_0_0)

- (NSNumber *)ReactABI16_0_0Tag
{
  return objc_getAssociatedObject(self, _cmd);
}

- (void)setReactABI16_0_0Tag:(NSNumber *)ReactABI16_0_0Tag
{
  objc_setAssociatedObject(self, @selector(ReactABI16_0_0Tag), ReactABI16_0_0Tag, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

#if ABI16_0_0RCT_DEV

- (ABI16_0_0RCTShadowView *)_DEBUG_ReactABI16_0_0ShadowView
{
  return objc_getAssociatedObject(self, _cmd);
}

- (void)_DEBUG_setReactABI16_0_0ShadowView:(ABI16_0_0RCTShadowView *)shadowView
{
  // Use assign to avoid keeping the shadowView alive it if no longer exists
  objc_setAssociatedObject(self, @selector(_DEBUG_ReactABI16_0_0ShadowView), shadowView, OBJC_ASSOCIATION_ASSIGN);
}

#endif

- (BOOL)isReactABI16_0_0RootView
{
  return ABI16_0_0RCTIsReactABI16_0_0RootView(self.ReactABI16_0_0Tag);
}

- (NSNumber *)ReactABI16_0_0TagAtPoint:(CGPoint)point
{
  UIView *view = [self hitTest:point withEvent:nil];
  while (view && !view.ReactABI16_0_0Tag) {
    view = view.superview;
  }
  return view.ReactABI16_0_0Tag;
}

- (NSArray<UIView *> *)ReactABI16_0_0Subviews
{
  return objc_getAssociatedObject(self, _cmd);
}

- (UIView *)ReactABI16_0_0Superview
{
  return self.superview;
}

- (void)insertReactABI16_0_0Subview:(UIView *)subview atIndex:(NSInteger)atIndex
{
  // We access the associated object directly here in case someone overrides
  // the `ReactABI16_0_0Subviews` getter method and returns an immutable array.
  NSMutableArray *subviews = objc_getAssociatedObject(self, @selector(ReactABI16_0_0Subviews));
  if (!subviews) {
    subviews = [NSMutableArray new];
    objc_setAssociatedObject(self, @selector(ReactABI16_0_0Subviews), subviews, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
  }
  [subviews insertObject:subview atIndex:atIndex];
}

- (void)removeReactABI16_0_0Subview:(UIView *)subview
{
  // We access the associated object directly here in case someone overrides
  // the `ReactABI16_0_0Subviews` getter method and returns an immutable array.
  NSMutableArray *subviews = objc_getAssociatedObject(self, @selector(ReactABI16_0_0Subviews));
  [subviews removeObject:subview];
  [subview removeFromSuperview];
}

- (UIUserInterfaceLayoutDirection)ReactABI16_0_0LayoutDirection
{
  if ([self respondsToSelector:@selector(semanticContentAttribute)]) {
    return [UIView userInterfaceLayoutDirectionForSemanticContentAttribute:self.semanticContentAttribute];
  } else {
    return [objc_getAssociatedObject(self, @selector(ReactABI16_0_0LayoutDirection)) integerValue];
  }
}

- (void)setReactABI16_0_0LayoutDirection:(UIUserInterfaceLayoutDirection)layoutDirection
{
  if ([self respondsToSelector:@selector(setSemanticContentAttribute:)]) {
    self.semanticContentAttribute =
      layoutDirection == UIUserInterfaceLayoutDirectionLeftToRight ?
        UISemanticContentAttributeForceLeftToRight :
        UISemanticContentAttributeForceRightToLeft;
  } else {
    objc_setAssociatedObject(self, @selector(ReactABI16_0_0LayoutDirection), @(layoutDirection), OBJC_ASSOCIATION_RETAIN_NONATOMIC);
  }
}

- (NSInteger)ReactABI16_0_0ZIndex
{
  return [objc_getAssociatedObject(self, _cmd) integerValue];
}

- (void)setReactABI16_0_0ZIndex:(NSInteger)ReactABI16_0_0ZIndex
{
  objc_setAssociatedObject(self, @selector(ReactABI16_0_0ZIndex), @(ReactABI16_0_0ZIndex), OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

- (NSArray<UIView *> *)sortedReactABI16_0_0Subviews
{
  NSArray *subviews = objc_getAssociatedObject(self, _cmd);
  if (!subviews) {
    // Check if sorting is required - in most cases it won't be
    BOOL sortingRequired = NO;
    for (UIView *subview in self.ReactABI16_0_0Subviews) {
      if (subview.ReactABI16_0_0ZIndex != 0) {
        sortingRequired = YES;
        break;
      }
    }
    subviews = sortingRequired ? [self.ReactABI16_0_0Subviews sortedArrayUsingComparator:^NSComparisonResult(UIView *a, UIView *b) {
      if (a.ReactABI16_0_0ZIndex > b.ReactABI16_0_0ZIndex) {
        return NSOrderedDescending;
      } else {
        // ensure sorting is stable by treating equal zIndex as ascending so
        // that original order is preserved
        return NSOrderedAscending;
      }
    }] : self.ReactABI16_0_0Subviews;
    objc_setAssociatedObject(self, _cmd, subviews, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
  }
  return subviews;
}

// private method, used to reset sort
- (void)clearSortedSubviews
{
  objc_setAssociatedObject(self, @selector(sortedReactABI16_0_0Subviews), nil, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

- (void)didUpdateReactABI16_0_0Subviews
{
  for (UIView *subview in self.sortedReactABI16_0_0Subviews) {
    [self addSubview:subview];
  }
}

- (void)ReactABI16_0_0SetFrame:(CGRect)frame
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
    ABI16_0_0RCTLogError(@"Invalid layout for (%@)%@. position: %@. bounds: %@",
                self.ReactABI16_0_0Tag, self, NSStringFromCGPoint(position), NSStringFromCGRect(bounds));
    return;
  }

  self.center = position;
  self.bounds = bounds;
}

- (void)ReactABI16_0_0SetInheritedBackgroundColor:(__unused UIColor *)inheritedBackgroundColor
{
  // Does nothing by default
}

- (UIViewController *)ReactABI16_0_0ViewController
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

- (void)ReactABI16_0_0AddControllerToClosestParent:(UIViewController *)controller
{
  if (!controller.parentViewController) {
    UIView *parentView = (UIView *)self.ReactABI16_0_0Superview;
    while (parentView) {
      if (parentView.ReactABI16_0_0ViewController) {
        [parentView.ReactABI16_0_0ViewController addChildViewController:controller];
        [controller didMoveToParentViewController:parentView.ReactABI16_0_0ViewController];
        break;
      }
      parentView = (UIView *)parentView.ReactABI16_0_0Superview;
    }
    return;
  }
}

/**
 * Responder overrides - to be deprecated.
 */
- (void)ReactABI16_0_0WillMakeFirstResponder {};
- (void)ReactABI16_0_0DidMakeFirstResponder {};
- (BOOL)ReactABI16_0_0RespondsToTouch:(__unused UITouch *)touch
{
  return YES;
}

@end

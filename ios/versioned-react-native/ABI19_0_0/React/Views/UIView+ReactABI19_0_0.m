/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "UIView+ReactABI19_0_0.h"

#import <objc/runtime.h>

#import "ABI19_0_0RCTAssert.h"
#import "ABI19_0_0RCTLog.h"
#import "ABI19_0_0RCTShadowView.h"

@implementation UIView (ReactABI19_0_0)

- (NSNumber *)ReactABI19_0_0Tag
{
  return objc_getAssociatedObject(self, _cmd);
}

- (void)setReactABI19_0_0Tag:(NSNumber *)ReactABI19_0_0Tag
{
  objc_setAssociatedObject(self, @selector(ReactABI19_0_0Tag), ReactABI19_0_0Tag, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

#if ABI19_0_0RCT_DEV

- (ABI19_0_0RCTShadowView *)_DEBUG_ReactABI19_0_0ShadowView
{
  return objc_getAssociatedObject(self, _cmd);
}

- (void)_DEBUG_setReactABI19_0_0ShadowView:(ABI19_0_0RCTShadowView *)shadowView
{
  // Use assign to avoid keeping the shadowView alive it if no longer exists
  objc_setAssociatedObject(self, @selector(_DEBUG_ReactABI19_0_0ShadowView), shadowView, OBJC_ASSOCIATION_ASSIGN);
}

#endif

- (BOOL)isReactABI19_0_0RootView
{
  return ABI19_0_0RCTIsReactABI19_0_0RootView(self.ReactABI19_0_0Tag);
}

- (NSNumber *)ReactABI19_0_0TagAtPoint:(CGPoint)point
{
  UIView *view = [self hitTest:point withEvent:nil];
  while (view && !view.ReactABI19_0_0Tag) {
    view = view.superview;
  }
  return view.ReactABI19_0_0Tag;
}

- (NSArray<UIView *> *)ReactABI19_0_0Subviews
{
  return objc_getAssociatedObject(self, _cmd);
}

- (UIView *)ReactABI19_0_0Superview
{
  return self.superview;
}

- (void)insertReactABI19_0_0Subview:(UIView *)subview atIndex:(NSInteger)atIndex
{
  // We access the associated object directly here in case someone overrides
  // the `ReactABI19_0_0Subviews` getter method and returns an immutable array.
  NSMutableArray *subviews = objc_getAssociatedObject(self, @selector(ReactABI19_0_0Subviews));
  if (!subviews) {
    subviews = [NSMutableArray new];
    objc_setAssociatedObject(self, @selector(ReactABI19_0_0Subviews), subviews, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
  }
  [subviews insertObject:subview atIndex:atIndex];
}

- (void)removeReactABI19_0_0Subview:(UIView *)subview
{
  // We access the associated object directly here in case someone overrides
  // the `ReactABI19_0_0Subviews` getter method and returns an immutable array.
  NSMutableArray *subviews = objc_getAssociatedObject(self, @selector(ReactABI19_0_0Subviews));
  [subviews removeObject:subview];
  [subview removeFromSuperview];
}

- (UIUserInterfaceLayoutDirection)ReactABI19_0_0LayoutDirection
{
  if ([self respondsToSelector:@selector(semanticContentAttribute)]) {
    return [UIView userInterfaceLayoutDirectionForSemanticContentAttribute:self.semanticContentAttribute];
  } else {
    return [objc_getAssociatedObject(self, @selector(ReactABI19_0_0LayoutDirection)) integerValue];
  }
}

- (void)setReactABI19_0_0LayoutDirection:(UIUserInterfaceLayoutDirection)layoutDirection
{
  if ([self respondsToSelector:@selector(setSemanticContentAttribute:)]) {
    self.semanticContentAttribute =
      layoutDirection == UIUserInterfaceLayoutDirectionLeftToRight ?
        UISemanticContentAttributeForceLeftToRight :
        UISemanticContentAttributeForceRightToLeft;
  } else {
    objc_setAssociatedObject(self, @selector(ReactABI19_0_0LayoutDirection), @(layoutDirection), OBJC_ASSOCIATION_RETAIN_NONATOMIC);
  }
}

- (NSInteger)ReactABI19_0_0ZIndex
{
  return self.layer.zPosition;
}

- (void)setReactABI19_0_0ZIndex:(NSInteger)ReactABI19_0_0ZIndex
{
  self.layer.zPosition = ReactABI19_0_0ZIndex;
}

- (NSArray<UIView *> *)ReactABI19_0_0ZIndexSortedSubviews
{
  // Check if sorting is required - in most cases it won't be.
  BOOL sortingRequired = NO;
  for (UIView *subview in self.subviews) {
    if (subview.ReactABI19_0_0ZIndex != 0) {
      sortingRequired = YES;
      break;
    }
  }
  return sortingRequired ? [self.ReactABI19_0_0Subviews sortedArrayUsingComparator:^NSComparisonResult(UIView *a, UIView *b) {
    if (a.ReactABI19_0_0ZIndex > b.ReactABI19_0_0ZIndex) {
      return NSOrderedDescending;
    } else {
      // Ensure sorting is stable by treating equal zIndex as ascending so
      // that original order is preserved.
      return NSOrderedAscending;
    }
  }] : self.subviews;
}

- (void)didUpdateReactABI19_0_0Subviews
{
  for (UIView *subview in self.ReactABI19_0_0Subviews) {
    [self addSubview:subview];
  }
}

- (void)ReactABI19_0_0SetFrame:(CGRect)frame
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
    ABI19_0_0RCTLogError(@"Invalid layout for (%@)%@. position: %@. bounds: %@",
                self.ReactABI19_0_0Tag, self, NSStringFromCGPoint(position), NSStringFromCGRect(bounds));
    return;
  }

  self.center = position;
  self.bounds = bounds;
}

- (void)ReactABI19_0_0SetInheritedBackgroundColor:(__unused UIColor *)inheritedBackgroundColor
{
  // Does nothing by default
}

- (UIViewController *)ReactABI19_0_0ViewController
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

- (void)ReactABI19_0_0AddControllerToClosestParent:(UIViewController *)controller
{
  if (!controller.parentViewController) {
    UIView *parentView = (UIView *)self.ReactABI19_0_0Superview;
    while (parentView) {
      if (parentView.ReactABI19_0_0ViewController) {
        [parentView.ReactABI19_0_0ViewController addChildViewController:controller];
        [controller didMoveToParentViewController:parentView.ReactABI19_0_0ViewController];
        break;
      }
      parentView = (UIView *)parentView.ReactABI19_0_0Superview;
    }
    return;
  }
}

/**
 * Focus manipulation.
 */
- (BOOL)ReactABI19_0_0IsFocusNeeded
{
  return [(NSNumber *)objc_getAssociatedObject(self, @selector(ReactABI19_0_0IsFocusNeeded)) boolValue];
}

- (void)setReactABI19_0_0IsFocusNeeded:(BOOL)isFocusNeeded
{
  objc_setAssociatedObject(self, @selector(ReactABI19_0_0IsFocusNeeded), @(isFocusNeeded), OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

- (void)ReactABI19_0_0Focus {
  if (![self becomeFirstResponder]) {
    self.ReactABI19_0_0IsFocusNeeded = YES;
  }
}

- (void)ReactABI19_0_0FocusIfNeeded {
  if (self.ReactABI19_0_0IsFocusNeeded) {
    if ([self becomeFirstResponder]) {
      self.ReactABI19_0_0IsFocusNeeded = NO;
    }
  }
}

- (void)ReactABI19_0_0Blur {
  [self resignFirstResponder];
}

#pragma mark - Layout

- (UIEdgeInsets)ReactABI19_0_0BorderInsets
{
  CGFloat borderWidth = self.layer.borderWidth;
  return UIEdgeInsetsMake(borderWidth, borderWidth, borderWidth, borderWidth);
}

- (UIEdgeInsets)ReactABI19_0_0PaddingInsets
{
  return UIEdgeInsetsZero;
}

- (UIEdgeInsets)ReactABI19_0_0CompoundInsets
{
  UIEdgeInsets borderInsets = self.ReactABI19_0_0BorderInsets;
  UIEdgeInsets paddingInsets = self.ReactABI19_0_0PaddingInsets;

  return UIEdgeInsetsMake(
    borderInsets.top + paddingInsets.top,
    borderInsets.left + paddingInsets.left,
    borderInsets.bottom + paddingInsets.bottom,
    borderInsets.right + paddingInsets.right
  );
}

- (CGRect)ReactABI19_0_0ContentFrame
{
  return UIEdgeInsetsInsetRect(self.bounds, self.ReactABI19_0_0CompoundInsets);
}

#pragma mark - Accessiblity

- (UIView *)ReactABI19_0_0AccessibilityElement
{
  return self;
}

@end

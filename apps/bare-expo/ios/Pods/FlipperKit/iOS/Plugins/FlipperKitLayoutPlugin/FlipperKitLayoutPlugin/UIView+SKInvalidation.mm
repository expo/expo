/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#if FB_SONARKIT_ENABLED

#import <UIKit/UIKit.h>
#import <objc/runtime.h>
#import "SKInvalidation.h"
#import "SKSwizzle.h"
#import "UIView+SKInvalidation.h"

FB_LINKABLE(UIView_SKInvalidation)
@implementation UIView (SKInvalidation)

+ (void)enableInvalidation {
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    swizzleMethods(
        [self class], @selector(setHidden:), @selector(swizzle_setHidden:));
    swizzleMethods(
        [self class], @selector(addSubview:), @selector(swizzle_addSubview:));
    swizzleMethods(
        [self class],
        @selector(bringSubviewToFront:),
        @selector(swizzle_bringSubviewToFront:));
    swizzleMethods(
        [self class],
        @selector(sendSubviewToBack:),
        @selector(swizzle_sendSubviewToBack:));
    swizzleMethods(
        [self class],
        @selector(insertSubview:atIndex:),
        @selector(swizzle_insertSubview:atIndex:));
    swizzleMethods(
        [self class],
        @selector(insertSubview:aboveSubview:),
        @selector(swizzle_insertSubview:aboveSubview:));
    swizzleMethods(
        [self class],
        @selector(insertSubview:belowSubview:),
        @selector(swizzle_insertSubview:belowSubview:));
    swizzleMethods(
        [self class],
        @selector(exchangeSubviewAtIndex:withSubviewAtIndex:),
        @selector(swizzle_exchangeSubviewAtIndex:withSubviewAtIndex:));
    swizzleMethods(
        [self class],
        @selector(removeFromSuperview),
        @selector(swizzle_removeFromSuperview));
  });
}

- (void)swizzle_setHidden:(BOOL)hidden {
  [self swizzle_setHidden:hidden];

  id<SKInvalidationDelegate> delegate =
      [SKInvalidation sharedInstance].delegate;
  if (delegate != nil) {
    [delegate invalidateNode:self.superview];
  }
}

- (void)swizzle_addSubview:(UIView*)view {
  [self swizzle_addSubview:view];
  [[SKInvalidation sharedInstance].delegate invalidateNode:self];
}

- (void)swizzle_bringSubviewToFront:(UIView*)subview {
  [self swizzle_bringSubviewToFront:subview];
  [[SKInvalidation sharedInstance].delegate invalidateNode:self];
}

- (void)swizzle_sendSubviewToBack:(UIView*)subview {
  [self swizzle_sendSubviewToBack:subview];
  [[SKInvalidation sharedInstance].delegate invalidateNode:self];
}

- (void)swizzle_insertSubview:(UIView*)subview atIndex:(NSInteger)index {
  [self swizzle_insertSubview:subview atIndex:index];
  [[SKInvalidation sharedInstance].delegate invalidateNode:self];
}

- (void)swizzle_insertSubview:(UIView*)subview
                 aboveSubview:(UIView*)siblingSubview {
  [self swizzle_insertSubview:subview aboveSubview:siblingSubview];
  [[SKInvalidation sharedInstance].delegate invalidateNode:self];
}

- (void)swizzle_insertSubview:(UIView*)subview
                 belowSubview:(UIView*)siblingSubview {
  [self swizzle_insertSubview:subview belowSubview:siblingSubview];
  [[SKInvalidation sharedInstance].delegate invalidateNode:self];
}

- (void)swizzle_exchangeSubviewAtIndex:(NSInteger)index1
                    withSubviewAtIndex:(NSInteger)index2 {
  [self swizzle_exchangeSubviewAtIndex:index1 withSubviewAtIndex:index2];
  [[SKInvalidation sharedInstance].delegate invalidateNode:self];
}

- (void)swizzle_removeFromSuperview {
  UIView* oldSuperview = self.superview;
  // Be careful that we always call the swizzled implementation
  // before any early returns or mischief below!
  [self swizzle_removeFromSuperview];

  if (oldSuperview) {
    [[SKInvalidation sharedInstance].delegate invalidateNode:oldSuperview];
  }
}

@end

#endif

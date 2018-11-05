/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI30_0_0RCTInputAccessoryViewContent.h"

#import <ReactABI30_0_0/UIView+ReactABI30_0_0.h>

@implementation ABI30_0_0RCTInputAccessoryViewContent
{
  UIView *_safeAreaContainer;
}

- (instancetype)init
{
  if (self = [super init]) {
    _safeAreaContainer = [UIView new];
    [self addSubview:_safeAreaContainer];
  }
  return self;
}

- (void)didMoveToSuperview
{

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 110000 /* __IPHONE_11_0 */
  // Avoid the home pill (in portrait mode) and notch (in landscape mode) on iPhoneX.
  if (@available(iOS 11.0, *)) {
    if (self.window) {
      [_safeAreaContainer.bottomAnchor
       constraintLessThanOrEqualToSystemSpacingBelowAnchor:self.window.safeAreaLayoutGuide.bottomAnchor
       multiplier:1.0f].active = YES;
      [_safeAreaContainer.leftAnchor
       constraintGreaterThanOrEqualToSystemSpacingAfterAnchor:self.window.safeAreaLayoutGuide.leftAnchor
       multiplier:1.0f].active = YES;
      [_safeAreaContainer.rightAnchor
       constraintLessThanOrEqualToSystemSpacingAfterAnchor:self.window.safeAreaLayoutGuide.rightAnchor
       multiplier:1.0f].active = YES;
    }
  }
#endif

}

- (void)setFrame:(CGRect)frame
{
  [super setFrame:frame];
  [_safeAreaContainer setFrame:frame];
}

- (void)insertReactABI30_0_0Subview:(UIView *)subview atIndex:(NSInteger)index
{
  [super insertReactABI30_0_0Subview:subview atIndex:index];
  [_safeAreaContainer insertSubview:subview atIndex:index];
}

- (void)removeReactABI30_0_0Subview:(UIView *)subview
{
  [super removeReactABI30_0_0Subview:subview];
  [subview removeFromSuperview];
  if ([[_safeAreaContainer subviews] count] == 0 && [self isFirstResponder]) {
    [self resignFirstResponder];
  }
}

@end

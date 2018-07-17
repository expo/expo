/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI29_0_0RCTInputAccessoryViewContent.h"

#import <ReactABI29_0_0/UIView+ReactABI29_0_0.h>

@interface ABI29_0_0RCTInputAccessoryViewContent()

// Overriding `inputAccessoryView` to `readwrite`.
@property (nonatomic, readwrite, retain) UIView *inputAccessoryView;

@end

@implementation ABI29_0_0RCTInputAccessoryViewContent

- (BOOL)canBecomeFirstResponder
{
  return true;
}

- (BOOL)becomeFirstResponder
{
  const BOOL becameFirstResponder = [super becomeFirstResponder];

  #if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 110000 /* __IPHONE_11_0 */
  // Avoiding the home pill and notch (landscape mode) on iphoneX.
  if (becameFirstResponder) {
    if (@available(iOS 11.0, *)) {
      [_contentView.bottomAnchor
       constraintLessThanOrEqualToSystemSpacingBelowAnchor:_contentView.window.safeAreaLayoutGuide.bottomAnchor
       multiplier:1.0f].active = YES;
      [_contentView.leftAnchor
       constraintLessThanOrEqualToSystemSpacingAfterAnchor:_contentView.window.safeAreaLayoutGuide.leftAnchor
       multiplier:1.0f].active = YES;
      [_contentView.rightAnchor
       constraintLessThanOrEqualToSystemSpacingAfterAnchor:_contentView.window.safeAreaLayoutGuide.rightAnchor
       multiplier:1.0f].active = YES;
    }
  }
  #endif

  return becameFirstResponder;
}

- (UIView *)inputAccessoryView
{
  if (!_inputAccessoryView) {
    _inputAccessoryView = [UIView new];
    _contentView = [UIView new];
    [_inputAccessoryView addSubview:_contentView];
  }
  return _inputAccessoryView;
}

- (void)insertReactABI29_0_0Subview:(UIView *)subview atIndex:(NSInteger)index
{
  [super insertReactABI29_0_0Subview:subview atIndex:index];
  [_contentView insertSubview:subview atIndex:index];
}

- (void)removeReactABI29_0_0Subview:(UIView *)subview
{
  [super removeReactABI29_0_0Subview:subview];
  [subview removeFromSuperview];
  if ([[_inputAccessoryView subviews] count] == 0 && [self isFirstResponder]) {
    [self resignFirstResponder];
  }
}

@end

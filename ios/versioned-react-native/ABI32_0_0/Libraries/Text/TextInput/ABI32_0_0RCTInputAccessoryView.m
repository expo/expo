/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI32_0_0RCTInputAccessoryView.h"

#import <ReactABI32_0_0/ABI32_0_0RCTBridge.h>
#import <ReactABI32_0_0/ABI32_0_0RCTTouchHandler.h>
#import <ReactABI32_0_0/UIView+ReactABI32_0_0.h>

#import "ABI32_0_0RCTInputAccessoryViewContent.h"

@interface ABI32_0_0RCTInputAccessoryView()

// Overriding `inputAccessoryView` to `readwrite`.
@property (nonatomic, readwrite, retain) UIView *inputAccessoryView;

@end

@implementation ABI32_0_0RCTInputAccessoryView
{
  BOOL _shouldBecomeFirstResponder;
}

- (instancetype)initWithBridge:(ABI32_0_0RCTBridge *)bridge
{
  if (self = [super init]) {
    _inputAccessoryView = [ABI32_0_0RCTInputAccessoryViewContent new];
    ABI32_0_0RCTTouchHandler *const touchHandler = [[ABI32_0_0RCTTouchHandler alloc] initWithBridge:bridge];
    [touchHandler attachToView:_inputAccessoryView];
  }
  return self;
}

- (BOOL)canBecomeFirstResponder
{
  return true;
}

- (void)ReactABI32_0_0SetFrame:(CGRect)frame
{
  [_inputAccessoryView setFrame:frame];

  if (_shouldBecomeFirstResponder) {
    _shouldBecomeFirstResponder = NO;
    [self becomeFirstResponder];
  }
}

- (void)insertReactABI32_0_0Subview:(UIView *)subview atIndex:(NSInteger)index
{
  [super insertReactABI32_0_0Subview:subview atIndex:index];
  [_inputAccessoryView insertReactABI32_0_0Subview:subview atIndex:index];
}

- (void)removeReactABI32_0_0Subview:(UIView *)subview
{
  [super removeReactABI32_0_0Subview:subview];
  [_inputAccessoryView removeReactABI32_0_0Subview:subview];
}

- (void)didUpdateReactABI32_0_0Subviews
{
  // Do nothing, as subviews are managed by `insertReactABI32_0_0Subview:atIndex:`.
}

- (void)didSetProps:(NSArray<NSString *> *)changedProps
{
  // If the accessory view is not linked to a text input via nativeID, assume it is
  // a standalone component that should get focus whenever it is rendered.
  if (![changedProps containsObject:@"nativeID"] && !self.nativeID) {
    _shouldBecomeFirstResponder = YES;
  }
}

@end

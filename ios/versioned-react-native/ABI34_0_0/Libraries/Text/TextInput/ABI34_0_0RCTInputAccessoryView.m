/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI34_0_0RCTInputAccessoryView.h"

#import <ReactABI34_0_0/ABI34_0_0RCTBridge.h>
#import <ReactABI34_0_0/ABI34_0_0RCTTouchHandler.h>
#import <ReactABI34_0_0/UIView+ReactABI34_0_0.h>

#import "ABI34_0_0RCTInputAccessoryViewContent.h"

@interface ABI34_0_0RCTInputAccessoryView()

// Overriding `inputAccessoryView` to `readwrite`.
@property (nonatomic, readwrite, retain) UIView *inputAccessoryView;

@end

@implementation ABI34_0_0RCTInputAccessoryView
{
  BOOL _shouldBecomeFirstResponder;
}

- (instancetype)initWithBridge:(ABI34_0_0RCTBridge *)bridge
{
  if (self = [super init]) {
    _inputAccessoryView = [ABI34_0_0RCTInputAccessoryViewContent new];
    ABI34_0_0RCTTouchHandler *const touchHandler = [[ABI34_0_0RCTTouchHandler alloc] initWithBridge:bridge];
    [touchHandler attachToView:_inputAccessoryView];
  }
  return self;
}

- (BOOL)canBecomeFirstResponder
{
  return true;
}

- (void)ReactABI34_0_0SetFrame:(CGRect)frame
{
  [_inputAccessoryView ReactABI34_0_0SetFrame:frame];

  if (_shouldBecomeFirstResponder) {
    _shouldBecomeFirstResponder = NO;
    [self becomeFirstResponder];
  }
}

- (void)insertReactABI34_0_0Subview:(UIView *)subview atIndex:(NSInteger)index
{
  [super insertReactABI34_0_0Subview:subview atIndex:index];
  [_inputAccessoryView insertReactABI34_0_0Subview:subview atIndex:index];
}

- (void)removeReactABI34_0_0Subview:(UIView *)subview
{
  [super removeReactABI34_0_0Subview:subview];
  [_inputAccessoryView removeReactABI34_0_0Subview:subview];
}

- (void)didUpdateReactABI34_0_0Subviews
{
  // Do nothing, as subviews are managed by `insertReactABI34_0_0Subview:atIndex:`.
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

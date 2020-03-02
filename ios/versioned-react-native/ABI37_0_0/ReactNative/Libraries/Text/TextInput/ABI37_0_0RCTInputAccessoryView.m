/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI37_0_0React/ABI37_0_0RCTInputAccessoryView.h>

#import <ABI37_0_0React/ABI37_0_0RCTBridge.h>
#import <ABI37_0_0React/ABI37_0_0RCTTouchHandler.h>
#import <ABI37_0_0React/ABI37_0_0UIView+React.h>

#import <ABI37_0_0React/ABI37_0_0RCTInputAccessoryViewContent.h>

@interface ABI37_0_0RCTInputAccessoryView()

// Overriding `inputAccessoryView` to `readwrite`.
@property (nonatomic, readwrite, retain) UIView *inputAccessoryView;

@end

@implementation ABI37_0_0RCTInputAccessoryView
{
  BOOL _shouldBecomeFirstResponder;
}

- (instancetype)initWithBridge:(ABI37_0_0RCTBridge *)bridge
{
  if (self = [super init]) {
    _inputAccessoryView = [ABI37_0_0RCTInputAccessoryViewContent new];
    ABI37_0_0RCTTouchHandler *const touchHandler = [[ABI37_0_0RCTTouchHandler alloc] initWithBridge:bridge];
    [touchHandler attachToView:_inputAccessoryView];
  }
  return self;
}

- (BOOL)canBecomeFirstResponder
{
  return true;
}

- (void)ABI37_0_0ReactSetFrame:(CGRect)frame
{
  [_inputAccessoryView ABI37_0_0ReactSetFrame:frame];

  if (_shouldBecomeFirstResponder) {
    _shouldBecomeFirstResponder = NO;
    [self becomeFirstResponder];
  }
}

- (void)insertABI37_0_0ReactSubview:(UIView *)subview atIndex:(NSInteger)index
{
  [super insertABI37_0_0ReactSubview:subview atIndex:index];
  [_inputAccessoryView insertABI37_0_0ReactSubview:subview atIndex:index];
}

- (void)removeABI37_0_0ReactSubview:(UIView *)subview
{
  [super removeABI37_0_0ReactSubview:subview];
  [_inputAccessoryView removeABI37_0_0ReactSubview:subview];
}

- (void)didUpdateABI37_0_0ReactSubviews
{
  // Do nothing, as subviews are managed by `insertABI37_0_0ReactSubview:atIndex:`.
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

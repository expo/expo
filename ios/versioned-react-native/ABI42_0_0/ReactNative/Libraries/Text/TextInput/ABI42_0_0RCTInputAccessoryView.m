/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI42_0_0React/ABI42_0_0RCTInputAccessoryView.h>

#import <ABI42_0_0React/ABI42_0_0RCTBridge.h>
#import <ABI42_0_0React/ABI42_0_0RCTTouchHandler.h>
#import <ABI42_0_0React/ABI42_0_0UIView+React.h>

#import <ABI42_0_0React/ABI42_0_0RCTInputAccessoryViewContent.h>

@interface ABI42_0_0RCTInputAccessoryView()

// Overriding `inputAccessoryView` to `readwrite`.
@property (nonatomic, readwrite, retain) UIView *inputAccessoryView;

@end

@implementation ABI42_0_0RCTInputAccessoryView
{
  BOOL _shouldBecomeFirstResponder;
}

- (instancetype)initWithBridge:(ABI42_0_0RCTBridge *)bridge
{
  if (self = [super init]) {
    _inputAccessoryView = [ABI42_0_0RCTInputAccessoryViewContent new];
    ABI42_0_0RCTTouchHandler *const touchHandler = [[ABI42_0_0RCTTouchHandler alloc] initWithBridge:bridge];
    [touchHandler attachToView:_inputAccessoryView];
  }
  return self;
}

- (BOOL)canBecomeFirstResponder
{
  return true;
}

- (void)ABI42_0_0ReactSetFrame:(CGRect)frame
{
  [_inputAccessoryView ABI42_0_0ReactSetFrame:frame];

  if (_shouldBecomeFirstResponder) {
    _shouldBecomeFirstResponder = NO;
    [self becomeFirstResponder];
  }
}

- (void)insertABI42_0_0ReactSubview:(UIView *)subview atIndex:(NSInteger)index
{
  [super insertABI42_0_0ReactSubview:subview atIndex:index];
  [_inputAccessoryView insertABI42_0_0ReactSubview:subview atIndex:index];
}

- (void)removeABI42_0_0ReactSubview:(UIView *)subview
{
  [super removeABI42_0_0ReactSubview:subview];
  [_inputAccessoryView removeABI42_0_0ReactSubview:subview];
}

- (void)didUpdateABI42_0_0ReactSubviews
{
  // Do nothing, as subviews are managed by `insertABI42_0_0ReactSubview:atIndex:`.
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

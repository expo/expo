/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI44_0_0React/ABI44_0_0RCTInputAccessoryView.h>

#import <ABI44_0_0React/ABI44_0_0RCTBridge.h>
#import <ABI44_0_0React/ABI44_0_0RCTTouchHandler.h>
#import <ABI44_0_0React/ABI44_0_0UIView+React.h>

#import <ABI44_0_0React/ABI44_0_0RCTInputAccessoryViewContent.h>

@interface ABI44_0_0RCTInputAccessoryView()

// Overriding `inputAccessoryView` to `readwrite`.
@property (nonatomic, readwrite, retain) UIView *inputAccessoryView;

@end

@implementation ABI44_0_0RCTInputAccessoryView
{
  BOOL _shouldBecomeFirstResponder;
}

- (instancetype)initWithBridge:(ABI44_0_0RCTBridge *)bridge
{
  if (self = [super init]) {
    _inputAccessoryView = [ABI44_0_0RCTInputAccessoryViewContent new];
    ABI44_0_0RCTTouchHandler *const touchHandler = [[ABI44_0_0RCTTouchHandler alloc] initWithBridge:bridge];
    [touchHandler attachToView:_inputAccessoryView];
  }
  return self;
}

- (BOOL)canBecomeFirstResponder
{
  return true;
}

- (void)ABI44_0_0ReactSetFrame:(CGRect)frame
{
  [_inputAccessoryView ABI44_0_0ReactSetFrame:frame];

  if (_shouldBecomeFirstResponder) {
    _shouldBecomeFirstResponder = NO;
    [self becomeFirstResponder];
  }
}

- (void)insertABI44_0_0ReactSubview:(UIView *)subview atIndex:(NSInteger)index
{
  [super insertABI44_0_0ReactSubview:subview atIndex:index];
  [_inputAccessoryView insertABI44_0_0ReactSubview:subview atIndex:index];
}

- (void)removeABI44_0_0ReactSubview:(UIView *)subview
{
  [super removeABI44_0_0ReactSubview:subview];
  [_inputAccessoryView removeABI44_0_0ReactSubview:subview];
}

- (void)didUpdateABI44_0_0ReactSubviews
{
  // Do nothing, as subviews are managed by `insertABI44_0_0ReactSubview:atIndex:`.
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

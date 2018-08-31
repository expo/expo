/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI30_0_0RCTInputAccessoryView.h"

#import <ReactABI30_0_0/ABI30_0_0RCTBridge.h>
#import <ReactABI30_0_0/ABI30_0_0RCTTouchHandler.h>
#import <ReactABI30_0_0/UIView+ReactABI30_0_0.h>

#import "ABI30_0_0RCTInputAccessoryViewContent.h"

@interface ABI30_0_0RCTInputAccessoryView()

// Overriding `inputAccessoryView` to `readwrite`.
@property (nonatomic, readwrite, retain) UIView *inputAccessoryView;

@end

@implementation ABI30_0_0RCTInputAccessoryView
{
  BOOL _shouldBecomeFirstResponder;
}

- (instancetype)initWithBridge:(ABI30_0_0RCTBridge *)bridge
{
  if (self = [super init]) {
    _inputAccessoryView = [ABI30_0_0RCTInputAccessoryViewContent new];
    ABI30_0_0RCTTouchHandler *const touchHandler = [[ABI30_0_0RCTTouchHandler alloc] initWithBridge:bridge];
    [touchHandler attachToView:_inputAccessoryView];
  }
  return self;
}

- (BOOL)canBecomeFirstResponder
{
  return true;
}

- (void)ReactABI30_0_0SetFrame:(CGRect)frame
{
  [_inputAccessoryView setFrame:frame];

  if (_shouldBecomeFirstResponder) {
    _shouldBecomeFirstResponder = NO;
    [self becomeFirstResponder];
  }
}

- (void)insertReactABI30_0_0Subview:(UIView *)subview atIndex:(NSInteger)index
{
  [super insertReactABI30_0_0Subview:subview atIndex:index];
  [_inputAccessoryView insertReactABI30_0_0Subview:subview atIndex:index];
}

- (void)removeReactABI30_0_0Subview:(UIView *)subview
{
  [super removeReactABI30_0_0Subview:subview];
  [_inputAccessoryView removeReactABI30_0_0Subview:subview];
}

- (void)didUpdateReactABI30_0_0Subviews
{
  // Do nothing, as subviews are managed by `insertReactABI30_0_0Subview:atIndex:`.
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

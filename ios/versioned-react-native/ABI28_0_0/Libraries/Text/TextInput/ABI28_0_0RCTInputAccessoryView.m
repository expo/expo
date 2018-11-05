/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI28_0_0RCTInputAccessoryView.h"

#import <ReactABI28_0_0/ABI28_0_0RCTBridge.h>
#import <ReactABI28_0_0/ABI28_0_0RCTTouchHandler.h>
#import <ReactABI28_0_0/UIView+ReactABI28_0_0.h>

#import "ABI28_0_0RCTInputAccessoryViewContent.h"

@implementation ABI28_0_0RCTInputAccessoryView
{
  BOOL _contentShouldBeFirstResponder;
}

- (instancetype)initWithBridge:(ABI28_0_0RCTBridge *)bridge
{
  if (self = [super init]) {
    _content = [ABI28_0_0RCTInputAccessoryViewContent new];
    ABI28_0_0RCTTouchHandler *const touchHandler = [[ABI28_0_0RCTTouchHandler alloc] initWithBridge:bridge];
    [touchHandler attachToView:_content.inputAccessoryView];
    [self addSubview:_content];
  }
  return self;
}

- (void)ReactABI28_0_0SetFrame:(CGRect)frame
{
  [_content.inputAccessoryView setFrame:frame];
  [_content.contentView setFrame:frame];

  if (_contentShouldBeFirstResponder) {
    _contentShouldBeFirstResponder = NO;
    [_content becomeFirstResponder];
  }
}

- (void)insertReactABI28_0_0Subview:(UIView *)subview atIndex:(NSInteger)index
{
  [super insertReactABI28_0_0Subview:subview atIndex:index];
  [_content insertReactABI28_0_0Subview:subview atIndex:index];
}

- (void)removeReactABI28_0_0Subview:(UIView *)subview
{
  [super removeReactABI28_0_0Subview:subview];
  [_content removeReactABI28_0_0Subview:subview];
}

- (void)didUpdateReactABI28_0_0Subviews
{
  // Do nothing, as subviews are managed by `insertReactABI28_0_0Subview:atIndex:`
}

- (void)didSetProps:(NSArray<NSString *> *)changedProps
{
  // If the accessory view is not linked to a text input via nativeID, assume it is
  // a standalone component that should get focus whenever it is rendered
  if (![changedProps containsObject:@"nativeID"] && !self.nativeID) {
    _contentShouldBeFirstResponder = YES;
  }
}

@end

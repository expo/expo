/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI27_0_0RCTInputAccessoryView.h"

#import <ReactABI27_0_0/ABI27_0_0RCTBridge.h>
#import <ReactABI27_0_0/ABI27_0_0RCTTouchHandler.h>
#import <ReactABI27_0_0/UIView+ReactABI27_0_0.h>

#import "ABI27_0_0RCTInputAccessoryViewContent.h"

@implementation ABI27_0_0RCTInputAccessoryView
{
  BOOL _contentShouldBeFirstResponder;
}

- (instancetype)initWithBridge:(ABI27_0_0RCTBridge *)bridge
{
  if (self = [super init]) {
    _content = [ABI27_0_0RCTInputAccessoryViewContent new];
    ABI27_0_0RCTTouchHandler *const touchHandler = [[ABI27_0_0RCTTouchHandler alloc] initWithBridge:bridge];
    [touchHandler attachToView:_content.inputAccessoryView];
    [self addSubview:_content];
  }
  return self;
}

- (void)ReactABI27_0_0SetFrame:(CGRect)frame
{
  [_content.inputAccessoryView setFrame:frame];
  [_content.contentView setFrame:frame];

  if (_contentShouldBeFirstResponder) {
    _contentShouldBeFirstResponder = NO;
    [_content becomeFirstResponder];
  }
}

- (void)insertReactABI27_0_0Subview:(UIView *)subview atIndex:(NSInteger)index
{
  [super insertReactABI27_0_0Subview:subview atIndex:index];
  [_content insertReactABI27_0_0Subview:subview atIndex:index];
}

- (void)removeReactABI27_0_0Subview:(UIView *)subview
{
  [super removeReactABI27_0_0Subview:subview];
  [_content removeReactABI27_0_0Subview:subview];
}

- (void)didUpdateReactABI27_0_0Subviews
{
  // Do nothing, as subviews are managed by `insertReactABI27_0_0Subview:atIndex:`
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

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI29_0_0RCTInputAccessoryView.h"

#import <ReactABI29_0_0/ABI29_0_0RCTBridge.h>
#import <ReactABI29_0_0/ABI29_0_0RCTTouchHandler.h>
#import <ReactABI29_0_0/UIView+ReactABI29_0_0.h>

#import "ABI29_0_0RCTInputAccessoryViewContent.h"

@implementation ABI29_0_0RCTInputAccessoryView
{
  BOOL _contentShouldBeFirstResponder;
}

- (instancetype)initWithBridge:(ABI29_0_0RCTBridge *)bridge
{
  if (self = [super init]) {
    _content = [ABI29_0_0RCTInputAccessoryViewContent new];
    ABI29_0_0RCTTouchHandler *const touchHandler = [[ABI29_0_0RCTTouchHandler alloc] initWithBridge:bridge];
    [touchHandler attachToView:_content.inputAccessoryView];
    [self addSubview:_content];
  }
  return self;
}

- (void)ReactABI29_0_0SetFrame:(CGRect)frame
{
  [_content.inputAccessoryView setFrame:frame];
  [_content.contentView setFrame:frame];

  if (_contentShouldBeFirstResponder) {
    _contentShouldBeFirstResponder = NO;
    [_content becomeFirstResponder];
  }
}

- (void)insertReactABI29_0_0Subview:(UIView *)subview atIndex:(NSInteger)index
{
  [super insertReactABI29_0_0Subview:subview atIndex:index];
  [_content insertReactABI29_0_0Subview:subview atIndex:index];
}

- (void)removeReactABI29_0_0Subview:(UIView *)subview
{
  [super removeReactABI29_0_0Subview:subview];
  [_content removeReactABI29_0_0Subview:subview];
}

- (void)didUpdateReactABI29_0_0Subviews
{
  // Do nothing, as subviews are managed by `insertReactABI29_0_0Subview:atIndex:`
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

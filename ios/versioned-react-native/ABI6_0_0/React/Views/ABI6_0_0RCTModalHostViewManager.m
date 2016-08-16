/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI6_0_0RCTModalHostViewManager.h"

#import "ABI6_0_0RCTBridge.h"
#import "ABI6_0_0RCTModalHostView.h"
#import "ABI6_0_0RCTTouchHandler.h"
#import "ABI6_0_0RCTShadowView.h"
#import "ABI6_0_0RCTUtils.h"

@interface ABI6_0_0RCTModalHostShadowView : ABI6_0_0RCTShadowView

@end

@implementation ABI6_0_0RCTModalHostShadowView

- (void)insertReactABI6_0_0Subview:(id<ABI6_0_0RCTComponent>)subview atIndex:(NSInteger)atIndex
{
  [super insertReactABI6_0_0Subview:subview atIndex:atIndex];
  if ([subview isKindOfClass:[ABI6_0_0RCTShadowView class]]) {
    CGRect frame = {.origin = CGPointZero, .size = ABI6_0_0RCTScreenSize()};
    [(ABI6_0_0RCTShadowView *)subview setFrame:frame];
  }
}

@end

@implementation ABI6_0_0RCTModalHostViewManager
{
  NSHashTable *_hostViews;
}

ABI6_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  UIView *view = [[ABI6_0_0RCTModalHostView alloc] initWithBridge:self.bridge];
  if (_hostViews) {
    _hostViews = [NSHashTable weakObjectsHashTable];
  }
  [_hostViews addObject:view];
  return view;
}

- (ABI6_0_0RCTShadowView *)shadowView
{
  return [ABI6_0_0RCTModalHostShadowView new];
}

- (void)invalidate
{
  for (ABI6_0_0RCTModalHostView *hostView in _hostViews) {
    [hostView invalidate];
  }
  [_hostViews removeAllObjects];
}

ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(animationType, NSString)
ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(transparent, BOOL)
ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(onShow, ABI6_0_0RCTDirectEventBlock)

@end

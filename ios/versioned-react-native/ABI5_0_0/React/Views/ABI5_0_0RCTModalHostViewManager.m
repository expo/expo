/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI5_0_0RCTModalHostViewManager.h"

#import "ABI5_0_0RCTBridge.h"
#import "ABI5_0_0RCTModalHostView.h"
#import "ABI5_0_0RCTTouchHandler.h"

@implementation ABI5_0_0RCTModalHostViewManager
{
  NSHashTable *_hostViews;
}

ABI5_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  UIView *view = [[ABI5_0_0RCTModalHostView alloc] initWithBridge:self.bridge];
  if (_hostViews) {
    _hostViews = [NSHashTable weakObjectsHashTable];
  }
  [_hostViews addObject:view];
  return view;
}

- (void)invalidate
{
  for (ABI5_0_0RCTModalHostView *hostView in _hostViews) {
    [hostView invalidate];
  }
  [_hostViews removeAllObjects];
}

ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(animated, BOOL)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(transparent, BOOL)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(onShow, ABI5_0_0RCTDirectEventBlock)

@end

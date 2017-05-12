/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI17_0_0RCTRefreshControlManager.h"

#import "ABI17_0_0RCTRefreshControl.h"

@implementation ABI17_0_0RCTRefreshControlManager

ABI17_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI17_0_0RCTRefreshControl new];
}

ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(onRefresh, ABI17_0_0RCTDirectEventBlock)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(refreshing, BOOL)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(titleColor, UIColor)

@end

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI14_0_0RCTRefreshControlManager.h"

#import "ABI14_0_0RCTRefreshControl.h"

@implementation ABI14_0_0RCTRefreshControlManager

ABI14_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI14_0_0RCTRefreshControl new];
}

ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(onRefresh, ABI14_0_0RCTDirectEventBlock)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(refreshing, BOOL)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(titleColor, UIColor)

@end

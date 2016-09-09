/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI10_0_0RCTRefreshControlManager.h"

#import "ABI10_0_0RCTRefreshControl.h"

@implementation ABI10_0_0RCTRefreshControlManager

ABI10_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI10_0_0RCTRefreshControl new];
}

ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(onRefresh, ABI10_0_0RCTDirectEventBlock)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(refreshing, BOOL)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(titleColor, UIColor)

@end

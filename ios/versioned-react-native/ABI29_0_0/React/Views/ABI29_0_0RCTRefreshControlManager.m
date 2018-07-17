/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI29_0_0RCTRefreshControlManager.h"

#import "ABI29_0_0RCTRefreshControl.h"

@implementation ABI29_0_0RCTRefreshControlManager

ABI29_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI29_0_0RCTRefreshControl new];
}

ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(onRefresh, ABI29_0_0RCTDirectEventBlock)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(refreshing, BOOL)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(titleColor, UIColor)

@end

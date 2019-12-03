/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI34_0_0RCTRefreshControlManager.h"

#import "ABI34_0_0RCTRefreshControl.h"

@implementation ABI34_0_0RCTRefreshControlManager

ABI34_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI34_0_0RCTRefreshControl new];
}

ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(onRefresh, ABI34_0_0RCTDirectEventBlock)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(refreshing, BOOL)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(titleColor, UIColor)

@end

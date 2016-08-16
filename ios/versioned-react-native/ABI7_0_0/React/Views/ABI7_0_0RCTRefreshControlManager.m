/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI7_0_0RCTRefreshControlManager.h"

#import "ABI7_0_0RCTRefreshControl.h"

@implementation ABI7_0_0RCTRefreshControlManager

ABI7_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI7_0_0RCTRefreshControl new];
}

ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(onRefresh, ABI7_0_0RCTDirectEventBlock)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(refreshing, BOOL)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(titleColor, UIColor)

@end

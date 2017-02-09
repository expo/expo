/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI14_0_0RCTTabBarManager.h"

#import "ABI14_0_0RCTBridge.h"
#import "ABI14_0_0RCTTabBar.h"

@implementation ABI14_0_0RCTConvert (UITabBar)

ABI14_0_0RCT_ENUM_CONVERTER(UITabBarItemPositioning, (@{
  @"fill" : @(UITabBarItemPositioningFill),
  @"auto" : @(UITabBarItemPositioningAutomatic),
  @"center" : @(UITabBarItemPositioningCentered)
}), UITabBarItemPositioningAutomatic, integerValue)

@end

@implementation ABI14_0_0RCTTabBarManager

ABI14_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI14_0_0RCTTabBar new];
}

ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(unselectedTintColor, UIColor)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(barTintColor, UIColor)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(translucent, BOOL)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(itemPositioning, UITabBarItemPositioning)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(unselectedItemTintColor, UIColor)

@end

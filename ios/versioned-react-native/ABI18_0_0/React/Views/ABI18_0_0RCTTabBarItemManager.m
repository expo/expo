/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI18_0_0RCTTabBarItemManager.h"

#import "ABI18_0_0RCTConvert.h"
#import "ABI18_0_0RCTTabBarItem.h"

@implementation ABI18_0_0RCTTabBarItemManager

ABI18_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI18_0_0RCTTabBarItem new];
}

ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(badge, id /* NSString or NSNumber */)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(renderAsOriginal, BOOL)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(selected, BOOL)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(icon, UIImage)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIcon, UIImage)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(systemIcon, UITabBarSystemItem)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI18_0_0RCTBubblingEventBlock)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(badgeColor, UIColor)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(isTVSelectable, BOOL)
ABI18_0_0RCT_CUSTOM_VIEW_PROPERTY(title, NSString, ABI18_0_0RCTTabBarItem)
{
  view.barItem.title = json ? [ABI18_0_0RCTConvert NSString:json] : defaultView.barItem.title;
  view.barItem.imageInsets = view.barItem.title.length ? UIEdgeInsetsZero : (UIEdgeInsets){6, 0, -6, 0};
}

@end

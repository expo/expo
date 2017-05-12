/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI17_0_0RCTTabBarItemManager.h"

#import "ABI17_0_0RCTConvert.h"
#import "ABI17_0_0RCTTabBarItem.h"

@implementation ABI17_0_0RCTTabBarItemManager

ABI17_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI17_0_0RCTTabBarItem new];
}

ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(badge, id /* NSString or NSNumber */)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(renderAsOriginal, BOOL)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(selected, BOOL)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(icon, UIImage)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIcon, UIImage)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(systemIcon, UITabBarSystemItem)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI17_0_0RCTBubblingEventBlock)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(badgeColor, UIColor)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(isTVSelectable, BOOL)
ABI17_0_0RCT_CUSTOM_VIEW_PROPERTY(title, NSString, ABI17_0_0RCTTabBarItem)
{
  view.barItem.title = json ? [ABI17_0_0RCTConvert NSString:json] : defaultView.barItem.title;
  view.barItem.imageInsets = view.barItem.title.length ? UIEdgeInsetsZero : (UIEdgeInsets){6, 0, -6, 0};
}

@end

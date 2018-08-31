/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI30_0_0RCTTabBarItemManager.h"

#import "ABI30_0_0RCTConvert.h"
#import "ABI30_0_0RCTTabBarItem.h"

@implementation ABI30_0_0RCTTabBarItemManager

ABI30_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI30_0_0RCTTabBarItem new];
}

ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(badge, id /* NSString or NSNumber */)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(renderAsOriginal, BOOL)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(selected, BOOL)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(icon, UIImage)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIcon, UIImage)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(systemIcon, UITabBarSystemItem)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI30_0_0RCTBubblingEventBlock)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(badgeColor, UIColor)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(isTVSelectable, BOOL)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(testID, NSString)
ABI30_0_0RCT_CUSTOM_VIEW_PROPERTY(title, NSString, ABI30_0_0RCTTabBarItem)
{
  view.barItem.title = json ? [ABI30_0_0RCTConvert NSString:json] : defaultView.barItem.title;
  view.barItem.imageInsets = view.barItem.title.length ? UIEdgeInsetsZero : (UIEdgeInsets){6, 0, -6, 0};
}

@end

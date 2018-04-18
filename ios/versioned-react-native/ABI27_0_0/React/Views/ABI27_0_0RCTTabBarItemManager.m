/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI27_0_0RCTTabBarItemManager.h"

#import "ABI27_0_0RCTConvert.h"
#import "ABI27_0_0RCTTabBarItem.h"

@implementation ABI27_0_0RCTTabBarItemManager

ABI27_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI27_0_0RCTTabBarItem new];
}

ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(badge, id /* NSString or NSNumber */)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(renderAsOriginal, BOOL)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(selected, BOOL)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(icon, UIImage)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIcon, UIImage)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(systemIcon, UITabBarSystemItem)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI27_0_0RCTBubblingEventBlock)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(badgeColor, UIColor)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(isTVSelectable, BOOL)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(testID, NSString)
ABI27_0_0RCT_CUSTOM_VIEW_PROPERTY(title, NSString, ABI27_0_0RCTTabBarItem)
{
  view.barItem.title = json ? [ABI27_0_0RCTConvert NSString:json] : defaultView.barItem.title;
  view.barItem.imageInsets = view.barItem.title.length ? UIEdgeInsetsZero : (UIEdgeInsets){6, 0, -6, 0};
}

@end

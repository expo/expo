/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI7_0_0RCTTabBarItemManager.h"

#import "ABI7_0_0RCTConvert.h"
#import "ABI7_0_0RCTTabBarItem.h"

@implementation ABI7_0_0RCTTabBarItemManager

ABI7_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI7_0_0RCTTabBarItem new];
}

ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(badge, id /* NSString or NSNumber */)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(renderAsOriginal, BOOL)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(selected, BOOL)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(icon, UIImage)
ABI7_0_0RCT_REMAP_VIEW_PROPERTY(selectedIcon, barItem.selectedImage, UIImage)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(systemIcon, UITabBarSystemItem)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI7_0_0RCTBubblingEventBlock)
ABI7_0_0RCT_CUSTOM_VIEW_PROPERTY(title, NSString, ABI7_0_0RCTTabBarItem)
{
  view.barItem.title = json ? [ABI7_0_0RCTConvert NSString:json] : defaultView.barItem.title;
  view.barItem.imageInsets = view.barItem.title.length ? UIEdgeInsetsZero : (UIEdgeInsets){6, 0, -6, 0};
}

@end

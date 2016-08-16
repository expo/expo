/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI8_0_0RCTNavItemManager.h"

#import "ABI8_0_0RCTConvert.h"
#import "ABI8_0_0RCTNavItem.h"

@implementation ABI8_0_0RCTNavItemManager

ABI8_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI8_0_0RCTNavItem new];
}

ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(navigationBarHidden, BOOL)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(shadowHidden, BOOL)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(barTintColor, UIColor)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(translucent, BOOL)

ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(titleTextColor, UIColor)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(titleImage, UIImage)

ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(backButtonIcon, UIImage)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(backButtonTitle, NSString)

ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(leftButtonTitle, NSString)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(leftButtonIcon, UIImage)

ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(rightButtonIcon, UIImage)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(rightButtonTitle, NSString)

ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(onLeftButtonPress, ABI8_0_0RCTBubblingEventBlock)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(onRightButtonPress, ABI8_0_0RCTBubblingEventBlock)

@end

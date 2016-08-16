/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI6_0_0RCTNavItemManager.h"

#import "ABI6_0_0RCTConvert.h"
#import "ABI6_0_0RCTNavItem.h"

@implementation ABI6_0_0RCTNavItemManager

ABI6_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI6_0_0RCTNavItem new];
}

ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(navigationBarHidden, BOOL)
ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(shadowHidden, BOOL)
ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(barTintColor, UIColor)
ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(translucent, BOOL)

ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(titleTextColor, UIColor)

ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(backButtonIcon, UIImage)
ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(backButtonTitle, NSString)

ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(leftButtonTitle, NSString)
ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(leftButtonIcon, UIImage)

ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(rightButtonIcon, UIImage)
ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(rightButtonTitle, NSString)

ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(onLeftButtonPress, ABI6_0_0RCTBubblingEventBlock)
ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(onRightButtonPress, ABI6_0_0RCTBubblingEventBlock)

@end

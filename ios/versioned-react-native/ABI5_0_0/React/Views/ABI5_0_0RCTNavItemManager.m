/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI5_0_0RCTNavItemManager.h"

#import "ABI5_0_0RCTConvert.h"
#import "ABI5_0_0RCTNavItem.h"

@implementation ABI5_0_0RCTNavItemManager

ABI5_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI5_0_0RCTNavItem new];
}

ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(navigationBarHidden, BOOL)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(shadowHidden, BOOL)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(barTintColor, UIColor)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(translucent, BOOL)

ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(titleTextColor, UIColor)

ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(backButtonIcon, UIImage)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(backButtonTitle, NSString)

ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(leftButtonTitle, NSString)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(leftButtonIcon, UIImage)

ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(rightButtonIcon, UIImage)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(rightButtonTitle, NSString)

ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(onLeftButtonPress, ABI5_0_0RCTBubblingEventBlock)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(onRightButtonPress, ABI5_0_0RCTBubblingEventBlock)

@end

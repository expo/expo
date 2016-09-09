/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI10_0_0RCTNavItemManager.h"

#import "ABI10_0_0RCTConvert.h"
#import "ABI10_0_0RCTNavItem.h"

@implementation ABI10_0_0RCTNavItemManager

ABI10_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI10_0_0RCTNavItem new];
}

ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(navigationBarHidden, BOOL)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(shadowHidden, BOOL)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(barTintColor, UIColor)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(translucent, BOOL)

ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(titleTextColor, UIColor)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(titleImage, UIImage)

ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(backButtonIcon, UIImage)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(backButtonTitle, NSString)

ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(leftButtonTitle, NSString)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(leftButtonIcon, UIImage)

ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(rightButtonIcon, UIImage)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(rightButtonTitle, NSString)

ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(onLeftButtonPress, ABI10_0_0RCTBubblingEventBlock)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(onRightButtonPress, ABI10_0_0RCTBubblingEventBlock)

@end

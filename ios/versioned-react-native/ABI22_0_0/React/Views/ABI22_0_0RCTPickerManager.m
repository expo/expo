/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI22_0_0RCTPickerManager.h"

#import "ABI22_0_0RCTBridge.h"
#import "ABI22_0_0RCTPicker.h"
#import "ABI22_0_0RCTFont.h"

@implementation ABI22_0_0RCTPickerManager

ABI22_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI22_0_0RCTPicker new];
}

ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(items, NSArray<NSDictionary *>)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI22_0_0RCTBubblingEventBlock)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(color, UIColor)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(textAlign, NSTextAlignment)
ABI22_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, NSNumber, ABI22_0_0RCTPicker)
{
  view.font = [ABI22_0_0RCTFont updateFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
ABI22_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, __unused ABI22_0_0RCTPicker)
{
  view.font = [ABI22_0_0RCTFont updateFont:view.font withWeight:json]; // defaults to normal
}
ABI22_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, __unused ABI22_0_0RCTPicker)
{
  view.font = [ABI22_0_0RCTFont updateFont:view.font withStyle:json]; // defaults to normal
}
ABI22_0_0RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, ABI22_0_0RCTPicker)
{
  view.font = [ABI22_0_0RCTFont updateFont:view.font withFamily:json ?: defaultView.font.familyName];
}

@end

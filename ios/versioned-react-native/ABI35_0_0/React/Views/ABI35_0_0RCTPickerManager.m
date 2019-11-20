/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI35_0_0RCTPickerManager.h"

#import "ABI35_0_0RCTBridge.h"
#import "ABI35_0_0RCTPicker.h"
#import "ABI35_0_0RCTFont.h"

@implementation ABI35_0_0RCTPickerManager

ABI35_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI35_0_0RCTPicker new];
}

ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(items, NSArray<NSDictionary *>)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI35_0_0RCTBubblingEventBlock)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(color, UIColor)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(textAlign, NSTextAlignment)
ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, NSNumber, ABI35_0_0RCTPicker)
{
  view.font = [ABI35_0_0RCTFont updateFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, __unused ABI35_0_0RCTPicker)
{
  view.font = [ABI35_0_0RCTFont updateFont:view.font withWeight:json]; // defaults to normal
}
ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, __unused ABI35_0_0RCTPicker)
{
  view.font = [ABI35_0_0RCTFont updateFont:view.font withStyle:json]; // defaults to normal
}
ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, ABI35_0_0RCTPicker)
{
  view.font = [ABI35_0_0RCTFont updateFont:view.font withFamily:json ?: defaultView.font.familyName];
}

@end

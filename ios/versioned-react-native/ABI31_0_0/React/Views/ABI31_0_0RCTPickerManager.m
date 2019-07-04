/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0RCTPickerManager.h"

#import "ABI31_0_0RCTBridge.h"
#import "ABI31_0_0RCTPicker.h"
#import "ABI31_0_0RCTFont.h"

@implementation ABI31_0_0RCTPickerManager

ABI31_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI31_0_0RCTPicker new];
}

ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(items, NSArray<NSDictionary *>)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI31_0_0RCTBubblingEventBlock)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(color, UIColor)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(textAlign, NSTextAlignment)
ABI31_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, NSNumber, ABI31_0_0RCTPicker)
{
  view.font = [ABI31_0_0RCTFont updateFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
ABI31_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, __unused ABI31_0_0RCTPicker)
{
  view.font = [ABI31_0_0RCTFont updateFont:view.font withWeight:json]; // defaults to normal
}
ABI31_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, __unused ABI31_0_0RCTPicker)
{
  view.font = [ABI31_0_0RCTFont updateFont:view.font withStyle:json]; // defaults to normal
}
ABI31_0_0RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, ABI31_0_0RCTPicker)
{
  view.font = [ABI31_0_0RCTFont updateFont:view.font withFamily:json ?: defaultView.font.familyName];
}

@end

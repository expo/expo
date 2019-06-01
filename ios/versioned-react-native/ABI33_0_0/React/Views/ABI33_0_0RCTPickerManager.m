/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI33_0_0RCTPickerManager.h"

#import "ABI33_0_0RCTBridge.h"
#import "ABI33_0_0RCTPicker.h"
#import "ABI33_0_0RCTFont.h"

@implementation ABI33_0_0RCTPickerManager

ABI33_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI33_0_0RCTPicker new];
}

ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(items, NSArray<NSDictionary *>)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI33_0_0RCTBubblingEventBlock)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(color, UIColor)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(textAlign, NSTextAlignment)
ABI33_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, NSNumber, ABI33_0_0RCTPicker)
{
  view.font = [ABI33_0_0RCTFont updateFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
ABI33_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, __unused ABI33_0_0RCTPicker)
{
  view.font = [ABI33_0_0RCTFont updateFont:view.font withWeight:json]; // defaults to normal
}
ABI33_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, __unused ABI33_0_0RCTPicker)
{
  view.font = [ABI33_0_0RCTFont updateFont:view.font withStyle:json]; // defaults to normal
}
ABI33_0_0RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, ABI33_0_0RCTPicker)
{
  view.font = [ABI33_0_0RCTFont updateFont:view.font withFamily:json ?: defaultView.font.familyName];
}

@end

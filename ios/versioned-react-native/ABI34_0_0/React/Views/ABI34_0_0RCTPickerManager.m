/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI34_0_0RCTPickerManager.h"

#import "ABI34_0_0RCTBridge.h"
#import "ABI34_0_0RCTPicker.h"
#import "ABI34_0_0RCTFont.h"

@implementation ABI34_0_0RCTPickerManager

ABI34_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI34_0_0RCTPicker new];
}

ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(items, NSArray<NSDictionary *>)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI34_0_0RCTBubblingEventBlock)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(color, UIColor)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(textAlign, NSTextAlignment)
ABI34_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, NSNumber, ABI34_0_0RCTPicker)
{
  view.font = [ABI34_0_0RCTFont updateFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
ABI34_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, __unused ABI34_0_0RCTPicker)
{
  view.font = [ABI34_0_0RCTFont updateFont:view.font withWeight:json]; // defaults to normal
}
ABI34_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, __unused ABI34_0_0RCTPicker)
{
  view.font = [ABI34_0_0RCTFont updateFont:view.font withStyle:json]; // defaults to normal
}
ABI34_0_0RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, ABI34_0_0RCTPicker)
{
  view.font = [ABI34_0_0RCTFont updateFont:view.font withFamily:json ?: defaultView.font.familyName];
}

@end

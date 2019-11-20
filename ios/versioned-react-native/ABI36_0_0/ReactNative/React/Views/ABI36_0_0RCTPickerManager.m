/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI36_0_0RCTPickerManager.h"

#import "ABI36_0_0RCTBridge.h"
#import "ABI36_0_0RCTPicker.h"
#import "ABI36_0_0RCTFont.h"

@implementation ABI36_0_0RCTPickerManager

ABI36_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI36_0_0RCTPicker new];
}

ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(items, NSArray<NSDictionary *>)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI36_0_0RCTBubblingEventBlock)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(color, UIColor)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(textAlign, NSTextAlignment)
ABI36_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, NSNumber, ABI36_0_0RCTPicker)
{
  view.font = [ABI36_0_0RCTFont updateFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
ABI36_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, __unused ABI36_0_0RCTPicker)
{
  view.font = [ABI36_0_0RCTFont updateFont:view.font withWeight:json]; // defaults to normal
}
ABI36_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, __unused ABI36_0_0RCTPicker)
{
  view.font = [ABI36_0_0RCTFont updateFont:view.font withStyle:json]; // defaults to normal
}
ABI36_0_0RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, ABI36_0_0RCTPicker)
{
  view.font = [ABI36_0_0RCTFont updateFont:view.font withFamily:json ?: defaultView.font.familyName];
}

@end

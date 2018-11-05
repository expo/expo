/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI27_0_0RCTPickerManager.h"

#import "ABI27_0_0RCTBridge.h"
#import "ABI27_0_0RCTPicker.h"
#import "ABI27_0_0RCTFont.h"

@implementation ABI27_0_0RCTPickerManager

ABI27_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI27_0_0RCTPicker new];
}

ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(items, NSArray<NSDictionary *>)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI27_0_0RCTBubblingEventBlock)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(color, UIColor)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(textAlign, NSTextAlignment)
ABI27_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, NSNumber, ABI27_0_0RCTPicker)
{
  view.font = [ABI27_0_0RCTFont updateFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
ABI27_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, __unused ABI27_0_0RCTPicker)
{
  view.font = [ABI27_0_0RCTFont updateFont:view.font withWeight:json]; // defaults to normal
}
ABI27_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, __unused ABI27_0_0RCTPicker)
{
  view.font = [ABI27_0_0RCTFont updateFont:view.font withStyle:json]; // defaults to normal
}
ABI27_0_0RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, ABI27_0_0RCTPicker)
{
  view.font = [ABI27_0_0RCTFont updateFont:view.font withFamily:json ?: defaultView.font.familyName];
}

@end

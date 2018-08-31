/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI30_0_0RCTPickerManager.h"

#import "ABI30_0_0RCTBridge.h"
#import "ABI30_0_0RCTPicker.h"
#import "ABI30_0_0RCTFont.h"

@implementation ABI30_0_0RCTPickerManager

ABI30_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI30_0_0RCTPicker new];
}

ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(items, NSArray<NSDictionary *>)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI30_0_0RCTBubblingEventBlock)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(color, UIColor)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(textAlign, NSTextAlignment)
ABI30_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, NSNumber, ABI30_0_0RCTPicker)
{
  view.font = [ABI30_0_0RCTFont updateFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
ABI30_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, __unused ABI30_0_0RCTPicker)
{
  view.font = [ABI30_0_0RCTFont updateFont:view.font withWeight:json]; // defaults to normal
}
ABI30_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, __unused ABI30_0_0RCTPicker)
{
  view.font = [ABI30_0_0RCTFont updateFont:view.font withStyle:json]; // defaults to normal
}
ABI30_0_0RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, ABI30_0_0RCTPicker)
{
  view.font = [ABI30_0_0RCTFont updateFont:view.font withFamily:json ?: defaultView.font.familyName];
}

@end

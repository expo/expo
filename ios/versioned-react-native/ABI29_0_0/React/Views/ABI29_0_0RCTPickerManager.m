/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI29_0_0RCTPickerManager.h"

#import "ABI29_0_0RCTBridge.h"
#import "ABI29_0_0RCTPicker.h"
#import "ABI29_0_0RCTFont.h"

@implementation ABI29_0_0RCTPickerManager

ABI29_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI29_0_0RCTPicker new];
}

ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(items, NSArray<NSDictionary *>)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI29_0_0RCTBubblingEventBlock)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(color, UIColor)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(textAlign, NSTextAlignment)
ABI29_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, NSNumber, ABI29_0_0RCTPicker)
{
  view.font = [ABI29_0_0RCTFont updateFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
ABI29_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, __unused ABI29_0_0RCTPicker)
{
  view.font = [ABI29_0_0RCTFont updateFont:view.font withWeight:json]; // defaults to normal
}
ABI29_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, __unused ABI29_0_0RCTPicker)
{
  view.font = [ABI29_0_0RCTFont updateFont:view.font withStyle:json]; // defaults to normal
}
ABI29_0_0RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, ABI29_0_0RCTPicker)
{
  view.font = [ABI29_0_0RCTFont updateFont:view.font withFamily:json ?: defaultView.font.familyName];
}

@end

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI8_0_0RCTPickerManager.h"

#import "ABI8_0_0RCTBridge.h"
#import "ABI8_0_0RCTPicker.h"

@implementation ABI8_0_0RCTPickerManager

ABI8_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI8_0_0RCTPicker new];
}

ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(items, NSArray<NSDictionary *>)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI8_0_0RCTBubblingEventBlock)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(color, UIColor)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(textAlign, NSTextAlignment)
ABI8_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, CGFloat, ABI8_0_0RCTPicker)
{
  view.font = [ABI8_0_0RCTConvert UIFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
ABI8_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, __unused ABI8_0_0RCTPicker)
{
  view.font = [ABI8_0_0RCTConvert UIFont:view.font withWeight:json]; // defaults to normal
}
ABI8_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, __unused ABI8_0_0RCTPicker)
{
  view.font = [ABI8_0_0RCTConvert UIFont:view.font withStyle:json]; // defaults to normal
}
ABI8_0_0RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, ABI8_0_0RCTPicker)
{
  view.font = [ABI8_0_0RCTConvert UIFont:view.font withFamily:json ?: defaultView.font.familyName];
}

@end

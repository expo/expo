/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI6_0_0RCTPickerManager.h"

#import "ABI6_0_0RCTBridge.h"
#import "ABI6_0_0RCTPicker.h"

@implementation ABI6_0_0RCTPickerManager

ABI6_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI6_0_0RCTPicker new];
}

ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(items, NSArray<NSDictionary *>)
ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI6_0_0RCTBubblingEventBlock)
ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(color, UIColor)
ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(textAlign, NSTextAlignment)
ABI6_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, CGFloat, ABI6_0_0RCTPicker)
{
  view.font = [ABI6_0_0RCTConvert UIFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
ABI6_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, __unused ABI6_0_0RCTPicker)
{
  view.font = [ABI6_0_0RCTConvert UIFont:view.font withWeight:json]; // defaults to normal
}
ABI6_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, __unused ABI6_0_0RCTPicker)
{
  view.font = [ABI6_0_0RCTConvert UIFont:view.font withStyle:json]; // defaults to normal
}
ABI6_0_0RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, ABI6_0_0RCTPicker)
{
  view.font = [ABI6_0_0RCTConvert UIFont:view.font withFamily:json ?: defaultView.font.familyName];
}

@end

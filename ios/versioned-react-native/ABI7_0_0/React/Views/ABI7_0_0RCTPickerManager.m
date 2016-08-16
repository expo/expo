/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI7_0_0RCTPickerManager.h"

#import "ABI7_0_0RCTBridge.h"
#import "ABI7_0_0RCTPicker.h"

@implementation ABI7_0_0RCTPickerManager

ABI7_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI7_0_0RCTPicker new];
}

ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(items, NSArray<NSDictionary *>)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI7_0_0RCTBubblingEventBlock)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(color, UIColor)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(textAlign, NSTextAlignment)
ABI7_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, CGFloat, ABI7_0_0RCTPicker)
{
  view.font = [ABI7_0_0RCTConvert UIFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
ABI7_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, __unused ABI7_0_0RCTPicker)
{
  view.font = [ABI7_0_0RCTConvert UIFont:view.font withWeight:json]; // defaults to normal
}
ABI7_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, __unused ABI7_0_0RCTPicker)
{
  view.font = [ABI7_0_0RCTConvert UIFont:view.font withStyle:json]; // defaults to normal
}
ABI7_0_0RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, ABI7_0_0RCTPicker)
{
  view.font = [ABI7_0_0RCTConvert UIFont:view.font withFamily:json ?: defaultView.font.familyName];
}

@end

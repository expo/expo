/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI25_0_0RCTPickerManager.h"

#import "ABI25_0_0RCTBridge.h"
#import "ABI25_0_0RCTPicker.h"
#import "ABI25_0_0RCTFont.h"

@implementation ABI25_0_0RCTPickerManager

ABI25_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI25_0_0RCTPicker new];
}

ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(items, NSArray<NSDictionary *>)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI25_0_0RCTBubblingEventBlock)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(color, UIColor)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(textAlign, NSTextAlignment)
ABI25_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, NSNumber, ABI25_0_0RCTPicker)
{
  view.font = [ABI25_0_0RCTFont updateFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
ABI25_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, __unused ABI25_0_0RCTPicker)
{
  view.font = [ABI25_0_0RCTFont updateFont:view.font withWeight:json]; // defaults to normal
}
ABI25_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, __unused ABI25_0_0RCTPicker)
{
  view.font = [ABI25_0_0RCTFont updateFont:view.font withStyle:json]; // defaults to normal
}
ABI25_0_0RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, ABI25_0_0RCTPicker)
{
  view.font = [ABI25_0_0RCTFont updateFont:view.font withFamily:json ?: defaultView.font.familyName];
}

@end

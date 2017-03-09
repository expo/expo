/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI15_0_0RCTPickerManager.h"

#import "ABI15_0_0RCTBridge.h"
#import "ABI15_0_0RCTPicker.h"
#import "ABI15_0_0RCTFont.h"

@implementation ABI15_0_0RCTPickerManager

ABI15_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI15_0_0RCTPicker new];
}

ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(items, NSArray<NSDictionary *>)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI15_0_0RCTBubblingEventBlock)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(color, UIColor)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(textAlign, NSTextAlignment)
ABI15_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, NSNumber, ABI15_0_0RCTPicker)
{
  view.font = [ABI15_0_0RCTFont updateFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
ABI15_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, __unused ABI15_0_0RCTPicker)
{
  view.font = [ABI15_0_0RCTFont updateFont:view.font withWeight:json]; // defaults to normal
}
ABI15_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, __unused ABI15_0_0RCTPicker)
{
  view.font = [ABI15_0_0RCTFont updateFont:view.font withStyle:json]; // defaults to normal
}
ABI15_0_0RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, ABI15_0_0RCTPicker)
{
  view.font = [ABI15_0_0RCTFont updateFont:view.font withFamily:json ?: defaultView.font.familyName];
}

@end

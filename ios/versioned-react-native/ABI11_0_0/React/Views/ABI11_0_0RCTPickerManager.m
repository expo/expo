/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI11_0_0RCTPickerManager.h"

#import "ABI11_0_0RCTBridge.h"
#import "ABI11_0_0RCTPicker.h"
#import "ABI11_0_0RCTFont.h"

@implementation ABI11_0_0RCTPickerManager

ABI11_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI11_0_0RCTPicker new];
}

ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(items, NSArray<NSDictionary *>)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI11_0_0RCTBubblingEventBlock)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(color, UIColor)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(textAlign, NSTextAlignment)
ABI11_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, NSNumber, ABI11_0_0RCTPicker)
{
  view.font = [ABI11_0_0RCTFont updateFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
ABI11_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, __unused ABI11_0_0RCTPicker)
{
  view.font = [ABI11_0_0RCTFont updateFont:view.font withWeight:json]; // defaults to normal
}
ABI11_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, __unused ABI11_0_0RCTPicker)
{
  view.font = [ABI11_0_0RCTFont updateFont:view.font withStyle:json]; // defaults to normal
}
ABI11_0_0RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, ABI11_0_0RCTPicker)
{
  view.font = [ABI11_0_0RCTFont updateFont:view.font withFamily:json ?: defaultView.font.familyName];
}

@end

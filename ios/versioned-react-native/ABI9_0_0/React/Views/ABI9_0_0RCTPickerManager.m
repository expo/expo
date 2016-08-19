/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI9_0_0RCTPickerManager.h"

#import "ABI9_0_0RCTBridge.h"
#import "ABI9_0_0RCTPicker.h"

@implementation ABI9_0_0RCTPickerManager

ABI9_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI9_0_0RCTPicker new];
}

ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(items, NSArray<NSDictionary *>)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI9_0_0RCTBubblingEventBlock)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(color, UIColor)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(textAlign, NSTextAlignment)
ABI9_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, CGFloat, ABI9_0_0RCTPicker)
{
  view.font = [ABI9_0_0RCTConvert UIFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
ABI9_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, __unused ABI9_0_0RCTPicker)
{
  view.font = [ABI9_0_0RCTConvert UIFont:view.font withWeight:json]; // defaults to normal
}
ABI9_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, __unused ABI9_0_0RCTPicker)
{
  view.font = [ABI9_0_0RCTConvert UIFont:view.font withStyle:json]; // defaults to normal
}
ABI9_0_0RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, ABI9_0_0RCTPicker)
{
  view.font = [ABI9_0_0RCTConvert UIFont:view.font withFamily:json ?: defaultView.font.familyName];
}

@end

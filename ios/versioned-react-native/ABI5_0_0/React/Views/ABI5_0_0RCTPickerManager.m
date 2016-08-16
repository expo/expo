/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI5_0_0RCTPickerManager.h"

#import "ABI5_0_0RCTBridge.h"
#import "ABI5_0_0RCTPicker.h"

@implementation ABI5_0_0RCTPickerManager

ABI5_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI5_0_0RCTPicker new];
}

ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(items, NSArray<NSDictionary *>)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI5_0_0RCTBubblingEventBlock)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(color, UIColor)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(textAlign, NSTextAlignment)
ABI5_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, CGFloat, ABI5_0_0RCTPicker)
{
  view.font = [ABI5_0_0RCTConvert UIFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
ABI5_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, __unused ABI5_0_0RCTPicker)
{
  view.font = [ABI5_0_0RCTConvert UIFont:view.font withWeight:json]; // defaults to normal
}
ABI5_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, __unused ABI5_0_0RCTPicker)
{
  view.font = [ABI5_0_0RCTConvert UIFont:view.font withStyle:json]; // defaults to normal
}
ABI5_0_0RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, ABI5_0_0RCTPicker)
{
  view.font = [ABI5_0_0RCTConvert UIFont:view.font withFamily:json ?: defaultView.font.familyName];
}

- (NSDictionary<NSString *, id> *)constantsToExport
{
  UIPickerView *view = [UIPickerView new];
  return @{
    @"ComponentHeight": @(view.intrinsicContentSize.height),
    @"ComponentWidth": @(view.intrinsicContentSize.width)
  };
}

@end

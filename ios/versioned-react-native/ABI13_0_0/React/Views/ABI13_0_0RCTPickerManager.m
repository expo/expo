/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI13_0_0RCTPickerManager.h"

#import "ABI13_0_0RCTBridge.h"
#import "ABI13_0_0RCTPicker.h"
#import "ABI13_0_0RCTFont.h"

@implementation ABI13_0_0RCTPickerManager

ABI13_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI13_0_0RCTPicker new];
}

ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(items, NSArray<NSDictionary *>)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI13_0_0RCTBubblingEventBlock)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(color, UIColor)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(textAlign, NSTextAlignment)
ABI13_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, NSNumber, ABI13_0_0RCTPicker)
{
  view.font = [ABI13_0_0RCTFont updateFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
ABI13_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, __unused ABI13_0_0RCTPicker)
{
  view.font = [ABI13_0_0RCTFont updateFont:view.font withWeight:json]; // defaults to normal
}
ABI13_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, __unused ABI13_0_0RCTPicker)
{
  view.font = [ABI13_0_0RCTFont updateFont:view.font withStyle:json]; // defaults to normal
}
ABI13_0_0RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, ABI13_0_0RCTPicker)
{
  view.font = [ABI13_0_0RCTFont updateFont:view.font withFamily:json ?: defaultView.font.familyName];
}

@end

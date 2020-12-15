/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI40_0_0RNCPickerManager.h"
#import "ABI40_0_0RNCPicker.h"

#import <ABI40_0_0React/ABI40_0_0RCTBridge.h>
#import <ABI40_0_0React/ABI40_0_0RCTFont.h>

@implementation ABI40_0_0RNCPickerManager

ABI40_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI40_0_0RNCPicker new];
}

ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(items, NSArray<NSDictionary *>)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI40_0_0RCTBubblingEventBlock)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(color, UIColor)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(textAlign, NSTextAlignment)
ABI40_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, NSNumber, ABI40_0_0RNCPicker)
{
  view.font = [ABI40_0_0RCTFont updateFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
ABI40_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, __unused ABI40_0_0RNCPicker)
{
  view.font = [ABI40_0_0RCTFont updateFont:view.font withWeight:json]; // defaults to normal
}
ABI40_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, __unused ABI40_0_0RNCPicker)
{
  view.font = [ABI40_0_0RCTFont updateFont:view.font withStyle:json]; // defaults to normal
}
ABI40_0_0RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, ABI40_0_0RNCPicker)
{
  view.font = [ABI40_0_0RCTFont updateFont:view.font withFamily:json ?: defaultView.font.familyName];
}

@end

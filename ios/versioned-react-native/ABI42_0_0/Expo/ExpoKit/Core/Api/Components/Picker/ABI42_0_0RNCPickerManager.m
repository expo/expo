/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI42_0_0RNCPickerManager.h"
#import "ABI42_0_0RNCPicker.h"

#import <ABI42_0_0React/ABI42_0_0RCTBridge.h>
#import <ABI42_0_0React/ABI42_0_0RCTFont.h>

@implementation ABI42_0_0RNCPickerManager

ABI42_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI42_0_0RNCPicker new];
}

ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(items, NSArray<NSDictionary *>)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI42_0_0RCTBubblingEventBlock)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(color, UIColor)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(textAlign, NSTextAlignment)
ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, NSNumber, ABI42_0_0RNCPicker)
{
  view.font = [ABI42_0_0RCTFont updateFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, __unused ABI42_0_0RNCPicker)
{
  view.font = [ABI42_0_0RCTFont updateFont:view.font withWeight:json]; // defaults to normal
}
ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, __unused ABI42_0_0RNCPicker)
{
  view.font = [ABI42_0_0RCTFont updateFont:view.font withStyle:json]; // defaults to normal
}
ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, ABI42_0_0RNCPicker)
{
  view.font = [ABI42_0_0RCTFont updateFont:view.font withFamily:json ?: defaultView.font.familyName];
}

@end

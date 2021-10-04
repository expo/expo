/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI43_0_0RNCPickerManager.h"
#import "ABI43_0_0RNCPicker.h"

#import <ABI43_0_0React/ABI43_0_0RCTBridge.h>
#import <ABI43_0_0React/ABI43_0_0RCTFont.h>

@implementation ABI43_0_0RNCPickerManager

ABI43_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI43_0_0RNCPicker new];
}

ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(items, NSArray<NSDictionary *>)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI43_0_0RCTBubblingEventBlock)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(color, UIColor)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(textAlign, NSTextAlignment)
ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, NSNumber, ABI43_0_0RNCPicker)
{
  view.font = [ABI43_0_0RCTFont updateFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, __unused ABI43_0_0RNCPicker)
{
  view.font = [ABI43_0_0RCTFont updateFont:view.font withWeight:json]; // defaults to normal
}
ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, __unused ABI43_0_0RNCPicker)
{
  view.font = [ABI43_0_0RCTFont updateFont:view.font withStyle:json]; // defaults to normal
}
ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, ABI43_0_0RNCPicker)
{
  view.font = [ABI43_0_0RCTFont updateFont:view.font withFamily:json ?: defaultView.font.familyName];
}

@end

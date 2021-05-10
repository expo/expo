/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI41_0_0RNCPickerManager.h"
#import "ABI41_0_0RNCPicker.h"

#import <ABI41_0_0React/ABI41_0_0RCTBridge.h>
#import <ABI41_0_0React/ABI41_0_0RCTFont.h>

@implementation ABI41_0_0RNCPickerManager

ABI41_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI41_0_0RNCPicker new];
}

ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(items, NSArray<NSDictionary *>)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI41_0_0RCTBubblingEventBlock)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(color, UIColor)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(textAlign, NSTextAlignment)
ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, NSNumber, ABI41_0_0RNCPicker)
{
  view.font = [ABI41_0_0RCTFont updateFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, __unused ABI41_0_0RNCPicker)
{
  view.font = [ABI41_0_0RCTFont updateFont:view.font withWeight:json]; // defaults to normal
}
ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, __unused ABI41_0_0RNCPicker)
{
  view.font = [ABI41_0_0RCTFont updateFont:view.font withStyle:json]; // defaults to normal
}
ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, ABI41_0_0RNCPicker)
{
  view.font = [ABI41_0_0RCTFont updateFont:view.font withFamily:json ?: defaultView.font.familyName];
}

@end

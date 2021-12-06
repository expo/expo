/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI44_0_0RNCPickerManager.h"
#import "ABI44_0_0RNCPicker.h"

#import <ABI44_0_0React/ABI44_0_0RCTBridge.h>
#import <ABI44_0_0React/ABI44_0_0RCTFont.h>

@implementation ABI44_0_0RNCPickerManager

ABI44_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI44_0_0RNCPicker new];
}

ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(items, NSArray<NSDictionary *>)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI44_0_0RCTBubblingEventBlock)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(color, UIColor)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(textAlign, NSTextAlignment)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(numberOfLines, NSInteger)
ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, NSNumber, ABI44_0_0RNCPicker)
{
  view.font = [ABI44_0_0RCTFont updateFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, __unused ABI44_0_0RNCPicker)
{
  view.font = [ABI44_0_0RCTFont updateFont:view.font withWeight:json]; // defaults to normal
}
ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, __unused ABI44_0_0RNCPicker)
{
  view.font = [ABI44_0_0RCTFont updateFont:view.font withStyle:json]; // defaults to normal
}
ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, ABI44_0_0RNCPicker)
{
  view.font = [ABI44_0_0RCTFont updateFont:view.font withFamily:json ?: defaultView.font.familyName];
}

@end

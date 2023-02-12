/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI46_0_0RNCPickerManager.h"
#import "ABI46_0_0RNCPicker.h"

#import <ABI46_0_0React/ABI46_0_0RCTBridge.h>
#import <ABI46_0_0React/ABI46_0_0RCTFont.h>

@implementation ABI46_0_0RNCPickerManager

ABI46_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI46_0_0RNCPicker new];
}

ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(items, NSArray<NSDictionary *>)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI46_0_0RCTBubblingEventBlock)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(color, UIColor)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(textAlign, NSTextAlignment)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(numberOfLines, NSInteger)
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, NSNumber, ABI46_0_0RNCPicker)
{
  view.font = [ABI46_0_0RCTFont updateFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, __unused ABI46_0_0RNCPicker)
{
  view.font = [ABI46_0_0RCTFont updateFont:view.font withWeight:json]; // defaults to normal
}
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, __unused ABI46_0_0RNCPicker)
{
  view.font = [ABI46_0_0RCTFont updateFont:view.font withStyle:json]; // defaults to normal
}
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, ABI46_0_0RNCPicker)
{
  view.font = [ABI46_0_0RCTFont updateFont:view.font withFamily:json ?: defaultView.font.familyName];
}
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(themeVariant, NSString, ABI46_0_0RNCPicker)
{
    if (@available(iOS 13.4, *)) {
            if (json) {
                if ([json isEqual:@"dark"])
                    view.overrideUserInterfaceStyle = UIUserInterfaceStyleDark;
                else if ([json isEqual:@"light"])
                    view.overrideUserInterfaceStyle = UIUserInterfaceStyleLight;
                else
                    view.overrideUserInterfaceStyle = UIUserInterfaceStyleUnspecified;
            }
        }
}

@end

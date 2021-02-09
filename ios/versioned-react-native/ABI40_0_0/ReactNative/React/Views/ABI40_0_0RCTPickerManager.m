/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI40_0_0RCTPickerManager.h"

#import <ABI40_0_0React/ABI40_0_0RCTUIManager.h>
#import "ABI40_0_0RCTBridge.h"
#import "ABI40_0_0RCTFont.h"
#import "ABI40_0_0RCTPicker.h"

@implementation ABI40_0_0RCTPickerManager

ABI40_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI40_0_0RCTPicker new];
}

ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(items, NSArray<NSDictionary *>)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
ABI40_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityLabel, ABI40_0_0ReactAccessibilityElement.accessibilityLabel, NSString)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI40_0_0RCTBubblingEventBlock)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(color, UIColor)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(textAlign, NSTextAlignment)
ABI40_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, NSNumber, ABI40_0_0RCTPicker)
{
  view.font = [ABI40_0_0RCTFont updateFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
ABI40_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, __unused ABI40_0_0RCTPicker)
{
  view.font = [ABI40_0_0RCTFont updateFont:view.font withWeight:json]; // defaults to normal
}
ABI40_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, __unused ABI40_0_0RCTPicker)
{
  view.font = [ABI40_0_0RCTFont updateFont:view.font withStyle:json]; // defaults to normal
}
ABI40_0_0RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, ABI40_0_0RCTPicker)
{
  view.font = [ABI40_0_0RCTFont updateFont:view.font withFamily:json ?: defaultView.font.familyName];
}

ABI40_0_0RCT_EXPORT_METHOD(setNativeSelectedIndex : (nonnull NSNumber *)viewTag toIndex : (nonnull NSNumber *)index)
{
  [self.bridge.uiManager addUIBlock:^(ABI40_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[viewTag];

    if ([view isKindOfClass:[ABI40_0_0RCTPicker class]]) {
      [(ABI40_0_0RCTPicker *)view setSelectedIndex:index.integerValue];
    } else {
      // This component is used in Fabric through LegacyInteropLayer.
      // `ABI40_0_0RCTPicker` view is subview of `ABI40_0_0RCTLegacyViewManagerInteropComponentView`.
      // `viewTag` passed as parameter to this method is tag of the `ABI40_0_0RCTLegacyViewManagerInteropComponentView`.
      UIView *subview = view.subviews.firstObject;
      if ([subview isKindOfClass:[ABI40_0_0RCTPicker class]]) {
        [(ABI40_0_0RCTPicker *)subview setSelectedIndex:index.integerValue];
      } else {
        ABI40_0_0RCTLogError(@"view type must be ABI40_0_0RCTPicker");
      }
    }
  }];
}

@end

/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI41_0_0RCTPickerManager.h"

#import <ABI41_0_0React/ABI41_0_0RCTUIManager.h>
#import "ABI41_0_0RCTBridge.h"
#import "ABI41_0_0RCTFont.h"
#import "ABI41_0_0RCTPicker.h"

@implementation ABI41_0_0RCTPickerManager

ABI41_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI41_0_0RCTPicker new];
}

ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(items, NSArray<NSDictionary *>)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
ABI41_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityLabel, ABI41_0_0ReactAccessibilityElement.accessibilityLabel, NSString)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI41_0_0RCTBubblingEventBlock)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(color, UIColor)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(textAlign, NSTextAlignment)
ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, NSNumber, ABI41_0_0RCTPicker)
{
  view.font = [ABI41_0_0RCTFont updateFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, __unused ABI41_0_0RCTPicker)
{
  view.font = [ABI41_0_0RCTFont updateFont:view.font withWeight:json]; // defaults to normal
}
ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, __unused ABI41_0_0RCTPicker)
{
  view.font = [ABI41_0_0RCTFont updateFont:view.font withStyle:json]; // defaults to normal
}
ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, ABI41_0_0RCTPicker)
{
  view.font = [ABI41_0_0RCTFont updateFont:view.font withFamily:json ?: defaultView.font.familyName];
}

ABI41_0_0RCT_EXPORT_METHOD(setNativeSelectedIndex : (nonnull NSNumber *)viewTag toIndex : (nonnull NSNumber *)index)
{
  [self.bridge.uiManager addUIBlock:^(ABI41_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[viewTag];

    if ([view isKindOfClass:[ABI41_0_0RCTPicker class]]) {
      [(ABI41_0_0RCTPicker *)view setSelectedIndex:index.integerValue];
    } else {
      // This component is used in Fabric through LegacyInteropLayer.
      // `ABI41_0_0RCTPicker` view is subview of `ABI41_0_0RCTLegacyViewManagerInteropComponentView`.
      // `viewTag` passed as parameter to this method is tag of the `ABI41_0_0RCTLegacyViewManagerInteropComponentView`.
      UIView *subview = view.subviews.firstObject;
      if ([subview isKindOfClass:[ABI41_0_0RCTPicker class]]) {
        [(ABI41_0_0RCTPicker *)subview setSelectedIndex:index.integerValue];
      } else {
        ABI41_0_0RCTLogError(@"view type must be ABI41_0_0RCTPicker");
      }
    }
  }];
}

@end

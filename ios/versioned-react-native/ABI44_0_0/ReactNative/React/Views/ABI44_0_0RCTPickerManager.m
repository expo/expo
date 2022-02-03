/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI44_0_0RCTPickerManager.h"

#import <ABI44_0_0React/ABI44_0_0RCTUIManager.h>
#import "ABI44_0_0RCTBridge.h"
#import "ABI44_0_0RCTFont.h"
#import "ABI44_0_0RCTPicker.h"

@implementation ABI44_0_0RCTPickerManager

ABI44_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI44_0_0RCTPicker new];
}

ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(items, NSArray<NSDictionary *>)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
ABI44_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityLabel, ABI44_0_0ReactAccessibilityElement.accessibilityLabel, NSString)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI44_0_0RCTBubblingEventBlock)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(color, UIColor)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(textAlign, NSTextAlignment)
ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, NSNumber, ABI44_0_0RCTPicker)
{
  view.font = [ABI44_0_0RCTFont updateFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, __unused ABI44_0_0RCTPicker)
{
  view.font = [ABI44_0_0RCTFont updateFont:view.font withWeight:json]; // defaults to normal
}
ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, __unused ABI44_0_0RCTPicker)
{
  view.font = [ABI44_0_0RCTFont updateFont:view.font withStyle:json]; // defaults to normal
}
ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, ABI44_0_0RCTPicker)
{
  view.font = [ABI44_0_0RCTFont updateFont:view.font withFamily:json ?: defaultView.font.familyName];
}

ABI44_0_0RCT_EXPORT_METHOD(setNativeSelectedIndex : (nonnull NSNumber *)viewTag toIndex : (nonnull NSNumber *)index)
{
  [self.bridge.uiManager addUIBlock:^(ABI44_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[viewTag];

    if ([view isKindOfClass:[ABI44_0_0RCTPicker class]]) {
      [(ABI44_0_0RCTPicker *)view setSelectedIndex:index.integerValue];
    } else {
      // This component is used in Fabric through LegacyInteropLayer.
      // `ABI44_0_0RCTPicker` view is subview of `ABI44_0_0RCTLegacyViewManagerInteropComponentView`.
      // `viewTag` passed as parameter to this method is tag of the `ABI44_0_0RCTLegacyViewManagerInteropComponentView`.
      UIView *subview = [uiManager viewForABI44_0_0ReactTag:viewTag].subviews.firstObject;
      if ([subview isKindOfClass:[ABI44_0_0RCTPicker class]]) {
        [(ABI44_0_0RCTPicker *)subview setSelectedIndex:index.integerValue];
      } else {
        ABI44_0_0RCTLogError(@"view type must be ABI44_0_0RCTPicker");
      }
    }
  }];
}

@end

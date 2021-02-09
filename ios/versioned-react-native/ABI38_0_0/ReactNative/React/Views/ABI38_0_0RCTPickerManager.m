/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI38_0_0RCTPickerManager.h"

#import "ABI38_0_0RCTBridge.h"
#import "ABI38_0_0RCTPicker.h"
#import "ABI38_0_0RCTFont.h"
#import <ABI38_0_0React/ABI38_0_0RCTUIManager.h>

@implementation ABI38_0_0RCTPickerManager

ABI38_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI38_0_0RCTPicker new];
}

ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(items, NSArray<NSDictionary *>)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI38_0_0RCTBubblingEventBlock)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(color, UIColor)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(textAlign, NSTextAlignment)
ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, NSNumber, ABI38_0_0RCTPicker)
{
  view.font = [ABI38_0_0RCTFont updateFont:view.font withSize:json ?: @(defaultView.font.pointSize)];
}
ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(fontWeight, NSString, __unused ABI38_0_0RCTPicker)
{
  view.font = [ABI38_0_0RCTFont updateFont:view.font withWeight:json]; // defaults to normal
}
ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSString, __unused ABI38_0_0RCTPicker)
{
  view.font = [ABI38_0_0RCTFont updateFont:view.font withStyle:json]; // defaults to normal
}
ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(fontFamily, NSString, ABI38_0_0RCTPicker)
{
  view.font = [ABI38_0_0RCTFont updateFont:view.font withFamily:json ?: defaultView.font.familyName];
}

ABI38_0_0RCT_EXPORT_METHOD(setNativeSelectedIndex : (nonnull NSNumber *)viewTag toIndex : (nonnull NSNumber *)index)
{
  [self.bridge.uiManager addUIBlock:^(ABI38_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[viewTag];
    
    if ([view isKindOfClass:[ABI38_0_0RCTPicker class]]) {
      [(ABI38_0_0RCTPicker *)view setSelectedIndex:index.integerValue];
    } else {
      UIView *subview = view.subviews.firstObject;
      if ([subview isKindOfClass:[ABI38_0_0RCTPicker class]]) {
        [(ABI38_0_0RCTPicker *)subview setSelectedIndex:index.integerValue];
      } else {
        ABI38_0_0RCTLogError(@"view type must be ABI38_0_0RCTPicker");
      }
    }
  }];
}

@end

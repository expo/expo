/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI43_0_0RCTSwitchManager.h"

#import <ABI43_0_0React/ABI43_0_0RCTUIManager.h>
#import "ABI43_0_0RCTBridge.h"
#import "ABI43_0_0RCTSwitch.h"
#import "ABI43_0_0UIView+React.h"

@implementation ABI43_0_0RCTSwitchManager

ABI43_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI43_0_0RCTSwitch *switcher = [ABI43_0_0RCTSwitch new];
  [switcher addTarget:self action:@selector(onChange:) forControlEvents:UIControlEventValueChanged];
  return switcher;
}

- (void)onChange:(ABI43_0_0RCTSwitch *)sender
{
  if (sender.wasOn != sender.on) {
    if (sender.onChange) {
      sender.onChange(@{@"value" : @(sender.on)});
    }
    sender.wasOn = sender.on;
  }
}

ABI43_0_0RCT_EXPORT_METHOD(setValue : (nonnull NSNumber *)viewTag toValue : (BOOL)value)
{
  [self.bridge.uiManager addUIBlock:^(ABI43_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[viewTag];

    if ([view isKindOfClass:[UISwitch class]]) {
      [(UISwitch *)view setOn:value animated:NO];
    } else {
      ABI43_0_0RCTLogError(@"view type must be UISwitch");
    }
  }];
}

ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(onTintColor, UIColor);
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor);
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(thumbTintColor, UIColor);
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(value, on, BOOL);
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI43_0_0RCTBubblingEventBlock);
ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(disabled, BOOL, ABI43_0_0RCTSwitch)
{
  if (json) {
    view.enabled = !([ABI43_0_0RCTConvert BOOL:json]);
  } else {
    view.enabled = defaultView.enabled;
  }
}
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(thumbColor, thumbTintColor, UIColor);
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(trackColorForFalse, tintColor, UIColor);
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(trackColorForTrue, onTintColor, UIColor);

@end

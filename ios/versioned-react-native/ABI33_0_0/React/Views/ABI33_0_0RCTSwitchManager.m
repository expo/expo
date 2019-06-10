/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI33_0_0RCTSwitchManager.h"

#import "ABI33_0_0RCTBridge.h"
#import "ABI33_0_0RCTEventDispatcher.h"
#import "ABI33_0_0RCTSwitch.h"
#import "UIView+ReactABI33_0_0.h"

@implementation ABI33_0_0RCTSwitchManager

ABI33_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI33_0_0RCTSwitch *switcher = [ABI33_0_0RCTSwitch new];
  [switcher addTarget:self
               action:@selector(onChange:)
     forControlEvents:UIControlEventValueChanged];
  return switcher;
}

- (void)onChange:(ABI33_0_0RCTSwitch *)sender
{
  if (sender.wasOn != sender.on) {
    if (sender.onChange) {
      sender.onChange(@{ @"value": @(sender.on) });
    }
    sender.wasOn = sender.on;
  }
}

ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(onTintColor, UIColor);
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor);
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(thumbTintColor, UIColor);
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(value, on, BOOL);
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI33_0_0RCTBubblingEventBlock);
ABI33_0_0RCT_CUSTOM_VIEW_PROPERTY(disabled, BOOL, ABI33_0_0RCTSwitch)
{
  if (json) {
    view.enabled = !([ABI33_0_0RCTConvert BOOL:json]);
  } else {
    view.enabled = defaultView.enabled;
  }
}
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(thumbColor, thumbTintColor, UIColor);
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(trackColorForFalse, tintColor, UIColor);
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(trackColorForTrue, onTintColor, UIColor);

@end

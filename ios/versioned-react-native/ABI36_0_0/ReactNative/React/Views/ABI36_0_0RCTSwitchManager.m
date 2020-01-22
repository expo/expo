/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI36_0_0RCTSwitchManager.h"

#import "ABI36_0_0RCTBridge.h"
#import "ABI36_0_0RCTEventDispatcher.h"
#import "ABI36_0_0RCTSwitch.h"
#import "ABI36_0_0UIView+React.h"

@implementation ABI36_0_0RCTSwitchManager

ABI36_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI36_0_0RCTSwitch *switcher = [ABI36_0_0RCTSwitch new];
  [switcher addTarget:self
               action:@selector(onChange:)
     forControlEvents:UIControlEventValueChanged];
  return switcher;
}

- (void)onChange:(ABI36_0_0RCTSwitch *)sender
{
  if (sender.wasOn != sender.on) {
    if (sender.onChange) {
      sender.onChange(@{ @"value": @(sender.on) });
    }
    sender.wasOn = sender.on;
  }
}

ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(onTintColor, UIColor);
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor);
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(thumbTintColor, UIColor);
ABI36_0_0RCT_REMAP_VIEW_PROPERTY(value, on, BOOL);
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI36_0_0RCTBubblingEventBlock);
ABI36_0_0RCT_CUSTOM_VIEW_PROPERTY(disabled, BOOL, ABI36_0_0RCTSwitch)
{
  if (json) {
    view.enabled = !([ABI36_0_0RCTConvert BOOL:json]);
  } else {
    view.enabled = defaultView.enabled;
  }
}
ABI36_0_0RCT_REMAP_VIEW_PROPERTY(thumbColor, thumbTintColor, UIColor);
ABI36_0_0RCT_REMAP_VIEW_PROPERTY(trackColorForFalse, tintColor, UIColor);
ABI36_0_0RCT_REMAP_VIEW_PROPERTY(trackColorForTrue, onTintColor, UIColor);

@end

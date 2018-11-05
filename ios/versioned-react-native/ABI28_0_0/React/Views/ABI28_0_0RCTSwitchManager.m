/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI28_0_0RCTSwitchManager.h"

#import "ABI28_0_0RCTBridge.h"
#import "ABI28_0_0RCTEventDispatcher.h"
#import "ABI28_0_0RCTSwitch.h"
#import "UIView+ReactABI28_0_0.h"

@implementation ABI28_0_0RCTSwitchManager

ABI28_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI28_0_0RCTSwitch *switcher = [ABI28_0_0RCTSwitch new];
  [switcher addTarget:self
               action:@selector(onChange:)
     forControlEvents:UIControlEventValueChanged];
  return switcher;
}

- (void)onChange:(ABI28_0_0RCTSwitch *)sender
{
  if (sender.wasOn != sender.on) {
    if (sender.onChange) {
      sender.onChange(@{ @"value": @(sender.on) });
    }
    sender.wasOn = sender.on;
  }
}

ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(onTintColor, UIColor);
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor);
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(thumbTintColor, UIColor);
ABI28_0_0RCT_REMAP_VIEW_PROPERTY(value, on, BOOL);
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI28_0_0RCTBubblingEventBlock);
ABI28_0_0RCT_CUSTOM_VIEW_PROPERTY(disabled, BOOL, ABI28_0_0RCTSwitch)
{
  if (json) {
    view.enabled = !([ABI28_0_0RCTConvert BOOL:json]);
  } else {
    view.enabled = defaultView.enabled;
  }
}

@end

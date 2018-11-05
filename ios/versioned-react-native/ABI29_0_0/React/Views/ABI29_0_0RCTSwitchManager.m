/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI29_0_0RCTSwitchManager.h"

#import "ABI29_0_0RCTBridge.h"
#import "ABI29_0_0RCTEventDispatcher.h"
#import "ABI29_0_0RCTSwitch.h"
#import "UIView+ReactABI29_0_0.h"

@implementation ABI29_0_0RCTSwitchManager

ABI29_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI29_0_0RCTSwitch *switcher = [ABI29_0_0RCTSwitch new];
  [switcher addTarget:self
               action:@selector(onChange:)
     forControlEvents:UIControlEventValueChanged];
  return switcher;
}

- (void)onChange:(ABI29_0_0RCTSwitch *)sender
{
  if (sender.wasOn != sender.on) {
    if (sender.onChange) {
      sender.onChange(@{ @"value": @(sender.on) });
    }
    sender.wasOn = sender.on;
  }
}

ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(onTintColor, UIColor);
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor);
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(thumbTintColor, UIColor);
ABI29_0_0RCT_REMAP_VIEW_PROPERTY(value, on, BOOL);
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI29_0_0RCTBubblingEventBlock);
ABI29_0_0RCT_CUSTOM_VIEW_PROPERTY(disabled, BOOL, ABI29_0_0RCTSwitch)
{
  if (json) {
    view.enabled = !([ABI29_0_0RCTConvert BOOL:json]);
  } else {
    view.enabled = defaultView.enabled;
  }
}

@end

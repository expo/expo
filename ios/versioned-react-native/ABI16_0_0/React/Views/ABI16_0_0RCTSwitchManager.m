/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI16_0_0RCTSwitchManager.h"

#import "ABI16_0_0RCTBridge.h"
#import "ABI16_0_0RCTEventDispatcher.h"
#import "ABI16_0_0RCTSwitch.h"
#import "UIView+ReactABI16_0_0.h"

@implementation ABI16_0_0RCTSwitchManager

ABI16_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI16_0_0RCTSwitch *switcher = [ABI16_0_0RCTSwitch new];
  [switcher addTarget:self
               action:@selector(onChange:)
     forControlEvents:UIControlEventValueChanged];
  return switcher;
}

- (void)onChange:(ABI16_0_0RCTSwitch *)sender
{
  if (sender.wasOn != sender.on) {
    if (sender.onChange) {
      sender.onChange(@{ @"value": @(sender.on) });
    }
    sender.wasOn = sender.on;
  }
}

ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onTintColor, UIColor);
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor);
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(thumbTintColor, UIColor);
ABI16_0_0RCT_REMAP_VIEW_PROPERTY(value, on, BOOL);
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI16_0_0RCTBubblingEventBlock);
ABI16_0_0RCT_CUSTOM_VIEW_PROPERTY(disabled, BOOL, ABI16_0_0RCTSwitch)
{
  if (json) {
    view.enabled = !([ABI16_0_0RCTConvert BOOL:json]);
  } else {
    view.enabled = defaultView.enabled;
  }
}

@end

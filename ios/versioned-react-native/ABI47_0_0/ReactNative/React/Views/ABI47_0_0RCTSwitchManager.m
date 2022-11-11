/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RCTSwitchManager.h"

#import <ABI47_0_0React/ABI47_0_0RCTUIManager.h>
#import "ABI47_0_0RCTBridge.h"
#import "ABI47_0_0RCTSwitch.h"
#import "ABI47_0_0UIView+React.h"

@implementation ABI47_0_0RCTSwitchManager

ABI47_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI47_0_0RCTSwitch *switcher = [ABI47_0_0RCTSwitch new];
  [switcher addTarget:self action:@selector(onChange:) forControlEvents:UIControlEventValueChanged];
  return switcher;
}

- (void)onChange:(ABI47_0_0RCTSwitch *)sender
{
  if (sender.wasOn != sender.on) {
    if (sender.onChange) {
      sender.onChange(@{@"value" : @(sender.on)});
    }
    sender.wasOn = sender.on;
  }
}

ABI47_0_0RCT_EXPORT_METHOD(setValue : (nonnull NSNumber *)viewTag toValue : (BOOL)value)
{
  [self.bridge.uiManager addUIBlock:^(ABI47_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[viewTag];

    if ([view isKindOfClass:[UISwitch class]]) {
      [(UISwitch *)view setOn:value animated:NO];
    } else {
      ABI47_0_0RCTLogError(@"view type must be UISwitch");
    }
  }];
}

ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onTintColor, UIColor);
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor);
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(thumbTintColor, UIColor);
ABI47_0_0RCT_REMAP_VIEW_PROPERTY(value, on, BOOL);
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI47_0_0RCTBubblingEventBlock);
ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(disabled, BOOL, ABI47_0_0RCTSwitch)
{
  if (json) {
    view.enabled = !([ABI47_0_0RCTConvert BOOL:json]);
  } else {
    view.enabled = defaultView.enabled;
  }
}
ABI47_0_0RCT_REMAP_VIEW_PROPERTY(thumbColor, thumbTintColor, UIColor);
ABI47_0_0RCT_REMAP_VIEW_PROPERTY(trackColorForFalse, tintColor, UIColor);
ABI47_0_0RCT_REMAP_VIEW_PROPERTY(trackColorForTrue, onTintColor, UIColor);

@end

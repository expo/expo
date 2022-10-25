/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RCTSliderManager.h"

#import "ABI47_0_0RCTBridge.h"
#import "ABI47_0_0RCTSlider.h"
#import "ABI47_0_0UIView+React.h"

@implementation ABI47_0_0RCTSliderManager

ABI47_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI47_0_0RCTSlider *slider = [ABI47_0_0RCTSlider new];
  [slider addTarget:self action:@selector(sliderValueChanged:) forControlEvents:UIControlEventValueChanged];
  [slider addTarget:self
                action:@selector(sliderTouchEnd:)
      forControlEvents:(UIControlEventTouchUpInside | UIControlEventTouchUpOutside | UIControlEventTouchCancel)];
  return slider;
}

static void ABI47_0_0RCTSendSliderEvent(ABI47_0_0RCTSlider *sender, BOOL continuous)
{
  float value = sender.value;

  if (sender.step > 0 && sender.step <= (sender.maximumValue - sender.minimumValue)) {
    value =
        MAX(sender.minimumValue,
            MIN(sender.maximumValue,
                sender.minimumValue + round((sender.value - sender.minimumValue) / sender.step) * sender.step));

    [sender setValue:value animated:YES];
  }

  if (continuous) {
    if (sender.onValueChange && sender.lastValue != value) {
      sender.onValueChange(@{
        @"value" : @(value),
      });
    }
  } else {
    if (sender.onSlidingComplete) {
      sender.onSlidingComplete(@{
        @"value" : @(value),
      });
    }
  }

  sender.lastValue = value;
}

- (void)sliderValueChanged:(ABI47_0_0RCTSlider *)sender
{
  ABI47_0_0RCTSendSliderEvent(sender, YES);
}

- (void)sliderTouchEnd:(ABI47_0_0RCTSlider *)sender
{
  ABI47_0_0RCTSendSliderEvent(sender, NO);
}

ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(value, float);
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(step, float);
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(trackImage, UIImage);
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(minimumTrackImage, UIImage);
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(maximumTrackImage, UIImage);
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(minimumValue, float);
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(maximumValue, float);
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(minimumTrackTintColor, UIColor);
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(maximumTrackTintColor, UIColor);
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onValueChange, ABI47_0_0RCTBubblingEventBlock);
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onSlidingComplete, ABI47_0_0RCTDirectEventBlock);
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(thumbTintColor, UIColor);
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(thumbImage, UIImage);
ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(disabled, BOOL, ABI47_0_0RCTSlider)
{
  if (json) {
    view.enabled = !([ABI47_0_0RCTConvert BOOL:json]);
  } else {
    view.enabled = defaultView.enabled;
  }
}
ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(enabled, BOOL, ABI47_0_0RCTSlider) {}

@end

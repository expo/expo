/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI10_0_0RCTSliderManager.h"

#import "ABI10_0_0RCTBridge.h"
#import "ABI10_0_0RCTEventDispatcher.h"
#import "ABI10_0_0RCTSlider.h"
#import "UIView+ReactABI10_0_0.h"

@implementation ABI10_0_0RCTSliderManager

ABI10_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI10_0_0RCTSlider *slider = [ABI10_0_0RCTSlider new];
  [slider addTarget:self action:@selector(sliderValueChanged:)
   forControlEvents:UIControlEventValueChanged];
  [slider addTarget:self action:@selector(sliderTouchEnd:)
   forControlEvents:(UIControlEventTouchUpInside |
                     UIControlEventTouchUpOutside |
                     UIControlEventTouchCancel)];
  return slider;
}

static void ABI10_0_0RCTSendSliderEvent(ABI10_0_0RCTSlider *sender, BOOL continuous)
{
  float value = sender.value;

  if (sender.step > 0 &&
      sender.step <= (sender.maximumValue - sender.minimumValue)) {

    value =
      MAX(sender.minimumValue,
        MIN(sender.maximumValue,
          sender.minimumValue + round((sender.value - sender.minimumValue) / sender.step) * sender.step
        )
      );

    [sender setValue:value animated:YES];
  }

  if (continuous) {
    if (sender.onValueChange && sender.lastValue != value) {
      sender.onValueChange(@{
        @"value": @(value),
      });
    }
  } else {
    if (sender.onSlidingComplete) {
      sender.onSlidingComplete(@{
        @"value": @(value),
      });
    }
  }

  sender.lastValue = value;
}

- (void)sliderValueChanged:(ABI10_0_0RCTSlider *)sender
{
  ABI10_0_0RCTSendSliderEvent(sender, YES);
}

- (void)sliderTouchEnd:(ABI10_0_0RCTSlider *)sender
{
  ABI10_0_0RCTSendSliderEvent(sender, NO);
}

ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(value, float);
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(step, float);
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(trackImage, UIImage);
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(minimumTrackImage, UIImage);
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(maximumTrackImage, UIImage);
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(minimumValue, float);
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(maximumValue, float);
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(minimumTrackTintColor, UIColor);
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(maximumTrackTintColor, UIColor);
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(onValueChange, ABI10_0_0RCTBubblingEventBlock);
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(onSlidingComplete, ABI10_0_0RCTBubblingEventBlock);
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(thumbImage, UIImage);
ABI10_0_0RCT_CUSTOM_VIEW_PROPERTY(disabled, BOOL, ABI10_0_0RCTSlider)
{
  if (json) {
    view.enabled = !([ABI10_0_0RCTConvert BOOL:json]);
  } else {
    view.enabled = defaultView.enabled;
  }
}

@end

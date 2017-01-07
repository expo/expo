/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI13_0_0RCTSliderManager.h"

#import "ABI13_0_0RCTBridge.h"
#import "ABI13_0_0RCTEventDispatcher.h"
#import "ABI13_0_0RCTSlider.h"
#import "UIView+ReactABI13_0_0.h"

@implementation ABI13_0_0RCTSliderManager

ABI13_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI13_0_0RCTSlider *slider = [ABI13_0_0RCTSlider new];
  [slider addTarget:self action:@selector(sliderValueChanged:)
   forControlEvents:UIControlEventValueChanged];
  [slider addTarget:self action:@selector(sliderTouchEnd:)
   forControlEvents:(UIControlEventTouchUpInside |
                     UIControlEventTouchUpOutside |
                     UIControlEventTouchCancel)];
  return slider;
}

static void ABI13_0_0RCTSendSliderEvent(ABI13_0_0RCTSlider *sender, BOOL continuous)
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

- (void)sliderValueChanged:(ABI13_0_0RCTSlider *)sender
{
  ABI13_0_0RCTSendSliderEvent(sender, YES);
}

- (void)sliderTouchEnd:(ABI13_0_0RCTSlider *)sender
{
  ABI13_0_0RCTSendSliderEvent(sender, NO);
}

ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(value, float);
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(step, float);
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(trackImage, UIImage);
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(minimumTrackImage, UIImage);
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(maximumTrackImage, UIImage);
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(minimumValue, float);
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(maximumValue, float);
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(minimumTrackTintColor, UIColor);
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(maximumTrackTintColor, UIColor);
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(onValueChange, ABI13_0_0RCTBubblingEventBlock);
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(onSlidingComplete, ABI13_0_0RCTBubblingEventBlock);
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(thumbImage, UIImage);
ABI13_0_0RCT_CUSTOM_VIEW_PROPERTY(disabled, BOOL, ABI13_0_0RCTSlider)
{
  if (json) {
    view.enabled = !([ABI13_0_0RCTConvert BOOL:json]);
  } else {
    view.enabled = defaultView.enabled;
  }
}

@end

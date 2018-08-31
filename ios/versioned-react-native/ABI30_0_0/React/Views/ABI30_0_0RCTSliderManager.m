/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI30_0_0RCTSliderManager.h"

#import "ABI30_0_0RCTBridge.h"
#import "ABI30_0_0RCTEventDispatcher.h"
#import "ABI30_0_0RCTSlider.h"
#import "UIView+ReactABI30_0_0.h"

@implementation ABI30_0_0RCTSliderManager

ABI30_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI30_0_0RCTSlider *slider = [ABI30_0_0RCTSlider new];
  [slider addTarget:self action:@selector(sliderValueChanged:)
   forControlEvents:UIControlEventValueChanged];
  [slider addTarget:self action:@selector(sliderTouchEnd:)
   forControlEvents:(UIControlEventTouchUpInside |
                     UIControlEventTouchUpOutside |
                     UIControlEventTouchCancel)];
  return slider;
}

static void ABI30_0_0RCTSendSliderEvent(ABI30_0_0RCTSlider *sender, BOOL continuous)
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

- (void)sliderValueChanged:(ABI30_0_0RCTSlider *)sender
{
  ABI30_0_0RCTSendSliderEvent(sender, YES);
}

- (void)sliderTouchEnd:(ABI30_0_0RCTSlider *)sender
{
  ABI30_0_0RCTSendSliderEvent(sender, NO);
}

ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(value, float);
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(step, float);
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(trackImage, UIImage);
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(minimumTrackImage, UIImage);
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(maximumTrackImage, UIImage);
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(minimumValue, float);
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(maximumValue, float);
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(minimumTrackTintColor, UIColor);
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(maximumTrackTintColor, UIColor);
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(onValueChange, ABI30_0_0RCTBubblingEventBlock);
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(onSlidingComplete, ABI30_0_0RCTBubblingEventBlock);
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(thumbImage, UIImage);
ABI30_0_0RCT_CUSTOM_VIEW_PROPERTY(disabled, BOOL, ABI30_0_0RCTSlider)
{
  if (json) {
    view.enabled = !([ABI30_0_0RCTConvert BOOL:json]);
  } else {
    view.enabled = defaultView.enabled;
  }
}

@end

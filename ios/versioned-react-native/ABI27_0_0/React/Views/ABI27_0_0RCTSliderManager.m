/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI27_0_0RCTSliderManager.h"

#import "ABI27_0_0RCTBridge.h"
#import "ABI27_0_0RCTEventDispatcher.h"
#import "ABI27_0_0RCTSlider.h"
#import "UIView+ReactABI27_0_0.h"

@implementation ABI27_0_0RCTSliderManager

ABI27_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI27_0_0RCTSlider *slider = [ABI27_0_0RCTSlider new];
  [slider addTarget:self action:@selector(sliderValueChanged:)
   forControlEvents:UIControlEventValueChanged];
  [slider addTarget:self action:@selector(sliderTouchEnd:)
   forControlEvents:(UIControlEventTouchUpInside |
                     UIControlEventTouchUpOutside |
                     UIControlEventTouchCancel)];
  return slider;
}

static void ABI27_0_0RCTSendSliderEvent(ABI27_0_0RCTSlider *sender, BOOL continuous)
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

- (void)sliderValueChanged:(ABI27_0_0RCTSlider *)sender
{
  ABI27_0_0RCTSendSliderEvent(sender, YES);
}

- (void)sliderTouchEnd:(ABI27_0_0RCTSlider *)sender
{
  ABI27_0_0RCTSendSliderEvent(sender, NO);
}

ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(value, float);
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(step, float);
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(trackImage, UIImage);
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(minimumTrackImage, UIImage);
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(maximumTrackImage, UIImage);
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(minimumValue, float);
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(maximumValue, float);
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(minimumTrackTintColor, UIColor);
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(maximumTrackTintColor, UIColor);
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(onValueChange, ABI27_0_0RCTBubblingEventBlock);
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(onSlidingComplete, ABI27_0_0RCTBubblingEventBlock);
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(thumbImage, UIImage);
ABI27_0_0RCT_CUSTOM_VIEW_PROPERTY(disabled, BOOL, ABI27_0_0RCTSlider)
{
  if (json) {
    view.enabled = !([ABI27_0_0RCTConvert BOOL:json]);
  } else {
    view.enabled = defaultView.enabled;
  }
}

@end

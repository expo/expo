/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI39_0_0RNCSliderManager.h"

#import <ABI39_0_0React/ABI39_0_0RCTBridge.h>
#import <ABI39_0_0React/ABI39_0_0RCTEventDispatcher.h>
#import "ABI39_0_0RNCSlider.h"
#import <ABI39_0_0React/ABI39_0_0UIView+React.h>

@implementation ABI39_0_0RNCSliderManager

ABI39_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI39_0_0RNCSlider *slider = [ABI39_0_0RNCSlider new];
  [slider addTarget:self action:@selector(sliderValueChanged:)
   forControlEvents:UIControlEventValueChanged];
  [slider addTarget:self action:@selector(sliderTouchStart:)
   forControlEvents:UIControlEventTouchDown];
  [slider addTarget:self action:@selector(sliderTouchEnd:)
   forControlEvents:(UIControlEventTouchUpInside |
                     UIControlEventTouchUpOutside |
                     UIControlEventTouchCancel)];
  return slider;
}

static void ABI39_0_0RNCSendSliderEvent(ABI39_0_0RNCSlider *sender, BOOL continuous, BOOL isSlidingStart)
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

    [sender setValue:value animated:NO];
  }

  if (continuous) {
    if (sender.onRNCSliderValueChange && sender.lastValue != value) {
      sender.onRNCSliderValueChange(@{
        @"value": @(value),
      });
    }
  } else {
    if (sender.onRNCSliderSlidingComplete && !isSlidingStart) {
      sender.onRNCSliderSlidingComplete(@{
        @"value": @(value),
      });
    }
      if (sender.onRNCSliderSlidingStart && isSlidingStart) {
        sender.onRNCSliderSlidingStart(@{
          @"value": @(value),
        });
      }
  }

  sender.lastValue = value;
}

- (void)sliderValueChanged:(ABI39_0_0RNCSlider *)sender
{
  ABI39_0_0RNCSendSliderEvent(sender, YES, NO);
}

- (void)sliderTouchStart:(ABI39_0_0RNCSlider *)sender
{
  ABI39_0_0RNCSendSliderEvent(sender, NO, YES);
}

- (void)sliderTouchEnd:(ABI39_0_0RNCSlider *)sender
{
  ABI39_0_0RNCSendSliderEvent(sender, NO, NO);
}

ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(value, float);
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(step, float);
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(trackImage, UIImage);
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(minimumTrackImage, UIImage);
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(maximumTrackImage, UIImage);
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(minimumValue, float);
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(maximumValue, float);
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(minimumTrackTintColor, UIColor);
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(maximumTrackTintColor, UIColor);
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(onRNCSliderValueChange, ABI39_0_0RCTBubblingEventBlock);
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(onRNCSliderSlidingStart, ABI39_0_0RCTBubblingEventBlock);
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(onRNCSliderSlidingComplete, ABI39_0_0RCTBubblingEventBlock);
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(thumbTintColor, UIColor);
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(thumbImage, UIImage);
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(inverted, BOOL);
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(accessibilityUnits, NSString);
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(accessibilityIncrements, NSArray);

ABI39_0_0RCT_CUSTOM_VIEW_PROPERTY(disabled, BOOL, ABI39_0_0RNCSlider)
{
  if (json) {
    view.enabled = !([ABI39_0_0RCTConvert BOOL:json]);
  } else {
    view.enabled = defaultView.enabled;
  }
}

@end

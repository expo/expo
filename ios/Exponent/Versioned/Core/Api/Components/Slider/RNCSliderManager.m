/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNCSliderManager.h"

#import <React/RCTBridge.h>
#import <React/RCTEventDispatcher.h>
#import "RNCSlider.h"
#import <React/UIView+React.h>

@implementation RNCSliderManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  RNCSlider *slider = [RNCSlider new];
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

static void RNCSendSliderEvent(RNCSlider *sender, BOOL continuous, BOOL isSlidingStart)
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

- (void)sliderValueChanged:(RNCSlider *)sender
{
  RNCSendSliderEvent(sender, YES, NO);
}

- (void)sliderTouchStart:(RNCSlider *)sender
{
  RNCSendSliderEvent(sender, NO, YES);
}

- (void)sliderTouchEnd:(RNCSlider *)sender
{
  RNCSendSliderEvent(sender, NO, NO);
}

RCT_EXPORT_VIEW_PROPERTY(value, float);
RCT_EXPORT_VIEW_PROPERTY(step, float);
RCT_EXPORT_VIEW_PROPERTY(trackImage, UIImage);
RCT_EXPORT_VIEW_PROPERTY(minimumTrackImage, UIImage);
RCT_EXPORT_VIEW_PROPERTY(maximumTrackImage, UIImage);
RCT_EXPORT_VIEW_PROPERTY(minimumValue, float);
RCT_EXPORT_VIEW_PROPERTY(maximumValue, float);
RCT_EXPORT_VIEW_PROPERTY(minimumTrackTintColor, UIColor);
RCT_EXPORT_VIEW_PROPERTY(maximumTrackTintColor, UIColor);
RCT_EXPORT_VIEW_PROPERTY(onRNCSliderValueChange, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onRNCSliderSlidingStart, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onRNCSliderSlidingComplete, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(thumbTintColor, UIColor);
RCT_EXPORT_VIEW_PROPERTY(thumbImage, UIImage);
RCT_EXPORT_VIEW_PROPERTY(inverted, BOOL);
RCT_EXPORT_VIEW_PROPERTY(accessibilityUnits, NSString);
RCT_EXPORT_VIEW_PROPERTY(accessibilityIncrements, NSArray);

RCT_CUSTOM_VIEW_PROPERTY(disabled, BOOL, RNCSlider)
{
  if (json) {
    view.enabled = !([RCTConvert BOOL:json]);
  } else {
    view.enabled = defaultView.enabled;
  }
}

@end

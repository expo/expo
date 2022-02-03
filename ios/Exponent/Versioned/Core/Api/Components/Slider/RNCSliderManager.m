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
{
  BOOL _isSliding;
}

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

  UITapGestureRecognizer *tapGesturer;
  tapGesturer = [[UITapGestureRecognizer alloc] initWithTarget: self action:@selector(tapHandler:)];
  [tapGesturer setNumberOfTapsRequired: 1];
  [slider addGestureRecognizer:tapGesturer];

  return slider;
}

- (void)tapHandler:(UITapGestureRecognizer *)gesture {
  // Ignore this tap if in the middle of a slide.
  if (_isSliding) {
    return;
  }

  // Bail out if the source view of the gesture isn't an RNCSlider.
  if ([gesture.view class] != [RNCSlider class]) {
    return;
  }
  RNCSlider *slider = (RNCSlider *)gesture.view;

  if (!slider.tapToSeek) {
    return;
  }

  CGPoint touchPoint = [gesture locationInView:slider];
  float rangeWidth = slider.maximumValue - slider.minimumValue;
  float sliderPercent = touchPoint.x / slider.bounds.size.width;
  slider.lastValue = slider.value;
  float value = slider.minimumValue + (rangeWidth * sliderPercent);

  [slider setValue:discreteValue(slider, value) animated: YES];


  if (slider.onRNCSliderSlidingStart) {
    slider.onRNCSliderSlidingStart(@{
      @"value": @(slider.lastValue),
    });
  }

  // Trigger onValueChange to address https://github.com/react-native-community/react-native-slider/issues/212
  if (slider.onRNCSliderValueChange) {
    slider.onRNCSliderValueChange(@{
      @"value": @(slider.value),
    });
  }

  if (slider.onRNCSliderSlidingComplete) {
    slider.onRNCSliderSlidingComplete(@{
      @"value": @(slider.value),
    });
  }
}

static float discreteValue(RNCSlider *sender, float value) {
  // Check if thumb should reach the maximum value and put it on the end of track if yes.
  // To avoid affecting the thumb when on maximum, the `step >= (value - maximum)` is not checked.
  if (sender.step > 0 && value >= sender.maximumValue) {
    return sender.maximumValue;
  }

  // If step is set and less than or equal to difference between max and min values,
  // pick the closest discrete multiple of step to return.
  if (sender.step > 0 && sender.step <= (sender.maximumValue - sender.minimumValue)) {
    
    // Round up when increase, round down when decrease.
    double (^_round)(double) = ^(double x) {
      if (!UIAccessibilityIsVoiceOverRunning()) {
        return round(x);
      } else if (sender.lastValue > value) {
        return floor(x);
      } else {
        return ceil(x);
      }
    };

    return
      MAX(sender.minimumValue,
        MIN(sender.maximumValue,
            sender.minimumValue + _round((value - sender.minimumValue) / sender.step) * sender.step
        )
      );
  }

  // Otherwise, leave value unchanged.
  return value;
}

static void RNCSendSliderEvent(RNCSlider *sender, BOOL continuous, BOOL isSlidingStart)
{
  float value = discreteValue(sender, sender.value);

  [sender setValue:value animated:NO];

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
  _isSliding = YES;
}

- (void)sliderTouchEnd:(RNCSlider *)sender
{
  RNCSendSliderEvent(sender, NO, NO);
  _isSliding = NO;
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
RCT_EXPORT_VIEW_PROPERTY(tapToSeek, BOOL);
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

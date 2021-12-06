/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI44_0_0RNCSliderManager.h"

#import <ABI44_0_0React/ABI44_0_0RCTBridge.h>
#import <ABI44_0_0React/ABI44_0_0RCTEventDispatcher.h>
#import "ABI44_0_0RNCSlider.h"
#import <ABI44_0_0React/ABI44_0_0UIView+React.h>

@implementation ABI44_0_0RNCSliderManager
{
  BOOL _isSliding;
}

ABI44_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI44_0_0RNCSlider *slider = [ABI44_0_0RNCSlider new];
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

  // Bail out if the source view of the gesture isn't an ABI44_0_0RNCSlider.
  if ([gesture.view class] != [ABI44_0_0RNCSlider class]) {
    return;
  }
  ABI44_0_0RNCSlider *slider = (ABI44_0_0RNCSlider *)gesture.view;

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

  // Trigger onValueChange to address https://github.com/ABI44_0_0React-native-community/ABI44_0_0React-native-slider/issues/212
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

static float discreteValue(ABI44_0_0RNCSlider *sender, float value) {
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

static void ABI44_0_0RNCSendSliderEvent(ABI44_0_0RNCSlider *sender, BOOL continuous, BOOL isSlidingStart)
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

- (void)sliderValueChanged:(ABI44_0_0RNCSlider *)sender
{
  ABI44_0_0RNCSendSliderEvent(sender, YES, NO);
}

- (void)sliderTouchStart:(ABI44_0_0RNCSlider *)sender
{
  ABI44_0_0RNCSendSliderEvent(sender, NO, YES);
  _isSliding = YES;
}

- (void)sliderTouchEnd:(ABI44_0_0RNCSlider *)sender
{
  ABI44_0_0RNCSendSliderEvent(sender, NO, NO);
  _isSliding = NO;
}

ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(value, float);
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(step, float);
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(trackImage, UIImage);
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(minimumTrackImage, UIImage);
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(maximumTrackImage, UIImage);
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(minimumValue, float);
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(maximumValue, float);
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(minimumTrackTintColor, UIColor);
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(maximumTrackTintColor, UIColor);
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onRNCSliderValueChange, ABI44_0_0RCTBubblingEventBlock);
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onRNCSliderSlidingStart, ABI44_0_0RCTBubblingEventBlock);
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onRNCSliderSlidingComplete, ABI44_0_0RCTBubblingEventBlock);
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(thumbTintColor, UIColor);
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(thumbImage, UIImage);
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(inverted, BOOL);
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(tapToSeek, BOOL);
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(accessibilityUnits, NSString);
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(accessibilityIncrements, NSArray);

ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(disabled, BOOL, ABI44_0_0RNCSlider)
{
  if (json) {
    view.enabled = !([ABI44_0_0RCTConvert BOOL:json]);
  } else {
    view.enabled = defaultView.enabled;
  }
}

@end

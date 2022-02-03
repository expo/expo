/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI43_0_0RNCSliderManager.h"

#import <ABI43_0_0React/ABI43_0_0RCTBridge.h>
#import <ABI43_0_0React/ABI43_0_0RCTEventDispatcher.h>
#import "ABI43_0_0RNCSlider.h"
#import <ABI43_0_0React/ABI43_0_0UIView+React.h>

@implementation ABI43_0_0RNCSliderManager
{
  BOOL _isSliding;
}

ABI43_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI43_0_0RNCSlider *slider = [ABI43_0_0RNCSlider new];
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

  // Bail out if the source view of the gesture isn't an ABI43_0_0RNCSlider.
  if ([gesture.view class] != [ABI43_0_0RNCSlider class]) {
    return;
  }
  ABI43_0_0RNCSlider *slider = (ABI43_0_0RNCSlider *)gesture.view;

  if (!slider.tapToSeek) {
    return;
  }

  CGPoint touchPoint = [gesture locationInView:slider];
  float rangeWidth = slider.maximumValue - slider.minimumValue;
  float sliderPercent = touchPoint.x / slider.bounds.size.width;
  float value = slider.minimumValue + (rangeWidth * sliderPercent);

  [slider setValue:discreteValue(slider, value) animated: YES];
  
  // Trigger onValueChange to address https://github.com/ABI43_0_0React-native-community/ABI43_0_0React-native-slider/issues/212
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

static float discreteValue(ABI43_0_0RNCSlider *sender, float value) {
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

static void ABI43_0_0RNCSendSliderEvent(ABI43_0_0RNCSlider *sender, BOOL continuous, BOOL isSlidingStart)
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

- (void)sliderValueChanged:(ABI43_0_0RNCSlider *)sender
{
  ABI43_0_0RNCSendSliderEvent(sender, YES, NO);
}

- (void)sliderTouchStart:(ABI43_0_0RNCSlider *)sender
{
  ABI43_0_0RNCSendSliderEvent(sender, NO, YES);
  _isSliding = YES;
}

- (void)sliderTouchEnd:(ABI43_0_0RNCSlider *)sender
{
  ABI43_0_0RNCSendSliderEvent(sender, NO, NO);
  _isSliding = NO;
}

ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(value, float);
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(step, float);
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(trackImage, UIImage);
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(minimumTrackImage, UIImage);
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(maximumTrackImage, UIImage);
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(minimumValue, float);
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(maximumValue, float);
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(minimumTrackTintColor, UIColor);
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(maximumTrackTintColor, UIColor);
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(onRNCSliderValueChange, ABI43_0_0RCTBubblingEventBlock);
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(onRNCSliderSlidingStart, ABI43_0_0RCTBubblingEventBlock);
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(onRNCSliderSlidingComplete, ABI43_0_0RCTBubblingEventBlock);
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(thumbTintColor, UIColor);
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(thumbImage, UIImage);
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(inverted, BOOL);
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(tapToSeek, BOOL);
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(accessibilityUnits, NSString);
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(accessibilityIncrements, NSArray);

ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(disabled, BOOL, ABI43_0_0RNCSlider)
{
  if (json) {
    view.enabled = !([ABI43_0_0RCTConvert BOOL:json]);
  } else {
    view.enabled = defaultView.enabled;
  }
}

@end

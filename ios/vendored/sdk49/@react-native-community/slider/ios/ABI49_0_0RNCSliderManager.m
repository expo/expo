/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RNCSliderManager.h"

#import <ABI49_0_0React/ABI49_0_0RCTBridge.h>
#import <ABI49_0_0React/ABI49_0_0RCTEventDispatcher.h>
#import "ABI49_0_0RNCSlider.h"
#import <ABI49_0_0React/ABI49_0_0UIView+React.h>

@implementation ABI49_0_0RNCSliderManager
{
  BOOL _isSliding;
}

ABI49_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI49_0_0RNCSlider *slider = [ABI49_0_0RNCSlider new];
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
  if ([gesture.view class] != [ABI49_0_0RNCSlider class]) {
    return;
  }
  ABI49_0_0RNCSlider *slider = (ABI49_0_0RNCSlider *)gesture.view;
  slider.isSliding = _isSliding;

  // Ignore this tap if in the middle of a slide.
  if (_isSliding) {
    return;
  }

  if (!slider.tapToSeek) {
    return;
  }

  CGPoint touchPoint = [gesture locationInView:slider];
  float rangeWidth = slider.maximumValue - slider.minimumValue;
  float sliderPercent = touchPoint.x / slider.bounds.size.width;
  slider.lastValue = slider.value;
  float value = slider.minimumValue + (rangeWidth * sliderPercent);

  [slider setValue:[slider discreteValue:value] animated: YES];

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

static void ABI49_0_0RNCSendSliderEvent(ABI49_0_0RNCSlider *sender, BOOL continuous, BOOL isSlidingStart)
{
  float value = [sender discreteValue:sender.value];

  if (value < sender.lowerLimit) {
      value = sender.lowerLimit;
      [sender setValue:value animated:NO];
  } else if (value > sender.upperLimit) {
      value = sender.upperLimit;
      [sender setValue:value animated:NO];
  }

  if(!sender.isSliding) {
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

- (void)sliderValueChanged:(ABI49_0_0RNCSlider *)sender
{
  ABI49_0_0RNCSendSliderEvent(sender, YES, NO);
}

- (void)sliderTouchStart:(ABI49_0_0RNCSlider *)sender
{
  ABI49_0_0RNCSendSliderEvent(sender, NO, YES);
  _isSliding = YES;
  sender.isSliding = YES;
}

- (void)sliderTouchEnd:(ABI49_0_0RNCSlider *)sender
{
  ABI49_0_0RNCSendSliderEvent(sender, NO, NO);
  _isSliding = NO;
  sender.isSliding = NO;
}

ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(value, float, ABI49_0_0RNCSlider)
{
  if (!view.isSliding) {
    view.value = [ABI49_0_0RCTConvert float:json];
  }
}
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(step, float);
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(trackImage, UIImage);
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(minimumTrackImage, UIImage);
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(maximumTrackImage, UIImage);
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(minimumValue, float);
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(maximumValue, float);
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(lowerLimit, float);
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(upperLimit, float);
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(minimumTrackTintColor, UIColor);
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(maximumTrackTintColor, UIColor);
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onRNCSliderValueChange, ABI49_0_0RCTBubblingEventBlock);
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onRNCSliderSlidingStart, ABI49_0_0RCTBubblingEventBlock);
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onRNCSliderSlidingComplete, ABI49_0_0RCTBubblingEventBlock);
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(thumbTintColor, UIColor);
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(thumbImage, UIImage);
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(inverted, BOOL);
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(tapToSeek, BOOL);
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(accessibilityUnits, NSString);
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(accessibilityIncrements, NSArray);

ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(disabled, BOOL, ABI49_0_0RNCSlider)
{
  if (json) {
    [view setDisabled: [ABI49_0_0RCTConvert BOOL:json]];
  } else {
    [view setDisabled: defaultView.enabled];
  }
}

@end

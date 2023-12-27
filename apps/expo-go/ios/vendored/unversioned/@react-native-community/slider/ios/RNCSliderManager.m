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
  if ([gesture.view class] != [RNCSlider class]) {
    return;
  }
  RNCSlider *slider = (RNCSlider *)gesture.view;
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

static void RNCSendSliderEvent(RNCSlider *sender, BOOL continuous, BOOL isSlidingStart)
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

- (void)sliderValueChanged:(RNCSlider *)sender
{
  RNCSendSliderEvent(sender, YES, NO);
}

- (void)sliderTouchStart:(RNCSlider *)sender
{
  RNCSendSliderEvent(sender, NO, YES);
  _isSliding = YES;
  sender.isSliding = YES;
}

- (void)sliderTouchEnd:(RNCSlider *)sender
{
  RNCSendSliderEvent(sender, NO, NO);
  _isSliding = NO;
  sender.isSliding = NO;
}

RCT_CUSTOM_VIEW_PROPERTY(value, float, RNCSlider)
{
  if (!view.isSliding) {
    view.value = [RCTConvert float:json];
  }
}
RCT_EXPORT_VIEW_PROPERTY(step, float);
RCT_EXPORT_VIEW_PROPERTY(trackImage, UIImage);
RCT_EXPORT_VIEW_PROPERTY(minimumTrackImage, UIImage);
RCT_EXPORT_VIEW_PROPERTY(maximumTrackImage, UIImage);
RCT_EXPORT_VIEW_PROPERTY(minimumValue, float);
RCT_EXPORT_VIEW_PROPERTY(maximumValue, float);
RCT_EXPORT_VIEW_PROPERTY(lowerLimit, float);
RCT_EXPORT_VIEW_PROPERTY(upperLimit, float);
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
    [view setDisabled: [RCTConvert BOOL:json]];
  } else {
    [view setDisabled: defaultView.enabled];
  }
}

@end

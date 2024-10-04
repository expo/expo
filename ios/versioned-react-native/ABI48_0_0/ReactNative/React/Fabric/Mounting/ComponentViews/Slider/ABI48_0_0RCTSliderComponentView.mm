/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RCTSliderComponentView.h"

#import <ABI48_0_0React/ABI48_0_0RCTConversions.h>
#import <ABI48_0_0React/ABI48_0_0RCTImageResponseDelegate.h>
#import <ABI48_0_0React/ABI48_0_0RCTImageResponseObserverProxy.h>

#import <ABI48_0_0React/ABI48_0_0renderer/components/rncore/EventEmitters.h>
#import <ABI48_0_0React/ABI48_0_0renderer/components/rncore/Props.h>
#import <ABI48_0_0React/ABI48_0_0renderer/components/slider/SliderComponentDescriptor.h>

#import "ABI48_0_0RCTFabricComponentsPlugins.h"

using namespace ABI48_0_0facebook::ABI48_0_0React;

@interface ABI48_0_0RCTSliderComponentView () <ABI48_0_0RCTImageResponseDelegate>
@end

@implementation ABI48_0_0RCTSliderComponentView {
  UISlider *_sliderView;
  float _previousValue;

  UIImage *_trackImage;
  UIImage *_minimumTrackImage;
  UIImage *_maximumTrackImage;
  UIImage *_thumbImage;

  ImageResponseObserverCoordinator const *_trackImageCoordinator;
  ImageResponseObserverCoordinator const *_minimumTrackImageCoordinator;
  ImageResponseObserverCoordinator const *_maximumTrackImageCoordinator;
  ImageResponseObserverCoordinator const *_thumbImageCoordinator;

  ABI48_0_0RCTImageResponseObserverProxy _trackImageResponseObserverProxy;
  ABI48_0_0RCTImageResponseObserverProxy _minimumTrackImageResponseObserverProxy;
  ABI48_0_0RCTImageResponseObserverProxy _maximumTrackImageResponseObserverProxy;
  ABI48_0_0RCTImageResponseObserverProxy _thumbImageResponseObserverProxy;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const SliderProps>();
    _props = defaultProps;

    _sliderView = [[UISlider alloc] initWithFrame:self.bounds];

    [_sliderView addTarget:self action:@selector(onChange:) forControlEvents:UIControlEventValueChanged];
    [_sliderView addTarget:self
                    action:@selector(sliderTouchEnd:)
          forControlEvents:(UIControlEventTouchUpInside | UIControlEventTouchUpOutside | UIControlEventTouchCancel)];

    _sliderView.value = (float)defaultProps->value;

    _trackImageResponseObserverProxy = ABI48_0_0RCTImageResponseObserverProxy(self);
    _minimumTrackImageResponseObserverProxy = ABI48_0_0RCTImageResponseObserverProxy(self);
    _maximumTrackImageResponseObserverProxy = ABI48_0_0RCTImageResponseObserverProxy(self);
    _thumbImageResponseObserverProxy = ABI48_0_0RCTImageResponseObserverProxy(self);

    self.contentView = _sliderView;
  }

  return self;
}

// Recycling still doesn't work 100% properly
// TODO: T40099998 implement recycling properly for Fabric Slider component
- (void)prepareForRecycle
{
  [super prepareForRecycle];

  self.trackImageCoordinator = nullptr;
  self.minimumTrackImageCoordinator = nullptr;
  self.maximumTrackImageCoordinator = nullptr;
  self.thumbImageCoordinator = nullptr;

  // Tint colors will be taken care of when props are set again - we just
  // need to make sure that image properties are reset here
  [_sliderView setMinimumTrackImage:nil forState:UIControlStateNormal];
  [_sliderView setMaximumTrackImage:nil forState:UIControlStateNormal];

  if (_thumbImage) {
    [_sliderView setThumbImage:nil forState:UIControlStateNormal];
  }

  _trackImage = nil;
  _minimumTrackImage = nil;
  _maximumTrackImage = nil;
  _thumbImage = nil;

  const auto &props = *std::static_pointer_cast<const SliderProps>(_props);
  _sliderView.value = (float)props.value;
  _previousValue = (float)props.value;
}

#pragma mark - ABI48_0_0RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<SliderComponentDescriptor>();
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &oldSliderProps = *std::static_pointer_cast<const SliderProps>(_props);
  const auto &newSliderProps = *std::static_pointer_cast<const SliderProps>(props);

  // `minimumValue`
  if (oldSliderProps.minimumValue != newSliderProps.minimumValue) {
    _sliderView.minimumValue = (float)newSliderProps.minimumValue;
  }

  // `maximumValue`
  if (oldSliderProps.maximumValue != newSliderProps.maximumValue) {
    _sliderView.maximumValue = (float)newSliderProps.maximumValue;
  }

  // `value`
  if (oldSliderProps.value != newSliderProps.value) {
    _sliderView.value = (float)newSliderProps.value;
    _previousValue = (float)newSliderProps.value;
  }

  // `disabled`
  if (oldSliderProps.disabled != newSliderProps.disabled) {
    _sliderView.enabled = !newSliderProps.disabled;
  }

  // `thumbTintColor`
  if (oldSliderProps.thumbTintColor != newSliderProps.thumbTintColor) {
    _sliderView.thumbTintColor = ABI48_0_0RCTUIColorFromSharedColor(newSliderProps.thumbTintColor);
  }

  // `minimumTrackTintColor`
  if (oldSliderProps.minimumTrackTintColor != newSliderProps.minimumTrackTintColor) {
    _sliderView.minimumTrackTintColor = ABI48_0_0RCTUIColorFromSharedColor(newSliderProps.minimumTrackTintColor);
  }

  // `maximumTrackTintColor`
  if (oldSliderProps.maximumTrackTintColor != newSliderProps.maximumTrackTintColor) {
    _sliderView.maximumTrackTintColor = ABI48_0_0RCTUIColorFromSharedColor(newSliderProps.maximumTrackTintColor);
  }

  [super updateProps:props oldProps:oldProps];
}

- (void)updateState:(ABI48_0_0facebook::ABI48_0_0React::State::Shared const &)state
           oldState:(ABI48_0_0facebook::ABI48_0_0React::State::Shared const &)oldState
{
  auto _state = std::static_pointer_cast<SliderShadowNode::ConcreteState const>(state);
  auto _oldState = std::static_pointer_cast<SliderShadowNode::ConcreteState const>(oldState);

  auto data = _state->getData();

  bool havePreviousData = _oldState != nullptr;

  auto getCoordinator = [](ImageRequest const *request) -> ImageResponseObserverCoordinator const * {
    if (request) {
      return &request->getObserverCoordinator();
    } else {
      return nullptr;
    }
  };

  if (!havePreviousData || data.getTrackImageSource() != _oldState->getData().getTrackImageSource()) {
    self.trackImageCoordinator = getCoordinator(&data.getTrackImageRequest());
  }

  if (!havePreviousData || data.getMinimumTrackImageSource() != _oldState->getData().getMinimumTrackImageSource()) {
    self.minimumTrackImageCoordinator = getCoordinator(&data.getMinimumTrackImageRequest());
  }

  if (!havePreviousData || data.getMaximumTrackImageSource() != _oldState->getData().getMaximumTrackImageSource()) {
    self.maximumTrackImageCoordinator = getCoordinator(&data.getMaximumTrackImageRequest());
  }

  if (!havePreviousData || data.getThumbImageSource() != _oldState->getData().getThumbImageSource()) {
    self.thumbImageCoordinator = getCoordinator(&data.getThumbImageRequest());
  }
}

- (void)setTrackImageCoordinator:(const ImageResponseObserverCoordinator *)coordinator
{
  if (_trackImageCoordinator) {
    _trackImageCoordinator->removeObserver(_trackImageResponseObserverProxy);
  }
  _trackImageCoordinator = coordinator;
  if (_trackImageCoordinator) {
    _trackImageCoordinator->addObserver(_trackImageResponseObserverProxy);
  }
}

- (void)setMinimumTrackImageCoordinator:(const ImageResponseObserverCoordinator *)coordinator
{
  if (_minimumTrackImageCoordinator) {
    _minimumTrackImageCoordinator->removeObserver(_minimumTrackImageResponseObserverProxy);
  }
  _minimumTrackImageCoordinator = coordinator;
  if (_minimumTrackImageCoordinator) {
    _minimumTrackImageCoordinator->addObserver(_minimumTrackImageResponseObserverProxy);
  }
}

- (void)setMaximumTrackImageCoordinator:(const ImageResponseObserverCoordinator *)coordinator
{
  if (_maximumTrackImageCoordinator) {
    _maximumTrackImageCoordinator->removeObserver(_maximumTrackImageResponseObserverProxy);
  }
  _maximumTrackImageCoordinator = coordinator;
  if (_maximumTrackImageCoordinator) {
    _maximumTrackImageCoordinator->addObserver(_maximumTrackImageResponseObserverProxy);
  }
}

- (void)setThumbImageCoordinator:(const ImageResponseObserverCoordinator *)coordinator
{
  if (_thumbImageCoordinator) {
    _thumbImageCoordinator->removeObserver(_thumbImageResponseObserverProxy);
  }
  _thumbImageCoordinator = coordinator;
  if (_thumbImageCoordinator) {
    _thumbImageCoordinator->addObserver(_thumbImageResponseObserverProxy);
  }
}

- (void)setTrackImage:(UIImage *)trackImage
{
  if ([trackImage isEqual:_trackImage]) {
    return;
  }

  _trackImage = trackImage;
  _minimumTrackImage = nil;
  _maximumTrackImage = nil;
  CGFloat width = trackImage.size.width / 2;
  UIImage *minimumTrackImage = [trackImage resizableImageWithCapInsets:(UIEdgeInsets){0, width, 0, width}
                                                          resizingMode:UIImageResizingModeStretch];
  UIImage *maximumTrackImage = [trackImage resizableImageWithCapInsets:(UIEdgeInsets){0, width, 0, width}
                                                          resizingMode:UIImageResizingModeStretch];
  [_sliderView setMinimumTrackImage:minimumTrackImage forState:UIControlStateNormal];
  [_sliderView setMaximumTrackImage:maximumTrackImage forState:UIControlStateNormal];
}

- (void)setMinimumTrackImage:(UIImage *)minimumTrackImage
{
  if ([minimumTrackImage isEqual:_minimumTrackImage] && _trackImage == nil) {
    return;
  }

  _trackImage = nil;
  _minimumTrackImage = minimumTrackImage;
  _minimumTrackImage =
      [_minimumTrackImage resizableImageWithCapInsets:(UIEdgeInsets){0, _minimumTrackImage.size.width, 0, 0}
                                         resizingMode:UIImageResizingModeStretch];
  [_sliderView setMinimumTrackImage:_minimumTrackImage forState:UIControlStateNormal];
}

- (void)setMaximumTrackImage:(UIImage *)maximumTrackImage
{
  if ([maximumTrackImage isEqual:_maximumTrackImage] && _trackImage == nil) {
    return;
  }

  _trackImage = nil;
  _maximumTrackImage = maximumTrackImage;
  _maximumTrackImage =
      [_maximumTrackImage resizableImageWithCapInsets:(UIEdgeInsets){0, 0, 0, _maximumTrackImage.size.width}
                                         resizingMode:UIImageResizingModeStretch];
  [_sliderView setMaximumTrackImage:_maximumTrackImage forState:UIControlStateNormal];
}

- (void)setThumbImage:(UIImage *)thumbImage
{
  if ([thumbImage isEqual:_thumbImage]) {
    return;
  }

  _thumbImage = thumbImage;
  [_sliderView setThumbImage:thumbImage forState:UIControlStateNormal];
}

- (void)onChange:(UISlider *)sender
{
  [self onChange:sender withContinuous:YES];
}

- (void)sliderTouchEnd:(UISlider *)sender
{
  [self onChange:sender withContinuous:NO];
}

- (void)onChange:(UISlider *)sender withContinuous:(BOOL)continuous
{
  float value = sender.value;

  const auto &props = *std::static_pointer_cast<const SliderProps>(_props);

  if (props.step > 0 && props.step <= (props.maximumValue - props.minimumValue)) {
    value = (float)std::max(
        props.minimumValue,
        std::min(
            props.maximumValue, props.minimumValue + round((value - props.minimumValue) / props.step) * props.step));

    [_sliderView setValue:value animated:YES];
  }

  if (continuous && _previousValue != value) {
    std::dynamic_pointer_cast<const SliderEventEmitter>(_eventEmitter)
        ->onValueChange(SliderEventEmitter::OnValueChange{.value = static_cast<Float>(value)});
  }
  if (!continuous) {
    std::dynamic_pointer_cast<const SliderEventEmitter>(_eventEmitter)
        ->onSlidingComplete(SliderEventEmitter::OnSlidingComplete{.value = static_cast<Float>(value)});
  }

  _previousValue = value;
}

#pragma mark - ABI48_0_0RCTImageResponseDelegate

- (void)didReceiveImage:(UIImage *)image metadata:(id)metadata fromObserver:(void const *)observer
{
  if (observer == &_trackImageResponseObserverProxy) {
    self.trackImage = image;
  } else if (observer == &_minimumTrackImageResponseObserverProxy) {
    self.minimumTrackImage = image;
  } else if (observer == &_maximumTrackImageResponseObserverProxy) {
    self.maximumTrackImage = image;
  } else if (observer == &_thumbImageResponseObserverProxy) {
    self.thumbImage = image;
  }
}

- (void)didReceiveProgress:(float)progress fromObserver:(void const *)observer
{
}

- (void)didReceiveFailureFromObserver:(void const *)observer
{
}

@end

Class<ABI48_0_0RCTComponentViewProtocol> ABI48_0_0RCTSliderCls(void)
{
  return ABI48_0_0RCTSliderComponentView.class;
}

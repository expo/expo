/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI43_0_0RCTImageComponentView.h"

#import <ABI43_0_0React/ABI43_0_0RCTConversions.h>
#import <ABI43_0_0React/ABI43_0_0RCTImageBlurUtils.h>
#import <ABI43_0_0React/ABI43_0_0RCTImageResponseObserverProxy.h>
#import <ABI43_0_0React/ABI43_0_0renderer/components/image/ImageComponentDescriptor.h>
#import <ABI43_0_0React/ABI43_0_0renderer/components/image/ImageEventEmitter.h>
#import <ABI43_0_0React/ABI43_0_0renderer/components/image/ImageProps.h>
#import <ABI43_0_0React/ABI43_0_0renderer/imagemanager/ImageRequest.h>
#import <ABI43_0_0React/ABI43_0_0renderer/imagemanager/ABI43_0_0RCTImagePrimitivesConversions.h>

using namespace ABI43_0_0facebook::ABI43_0_0React;

@interface ABI43_0_0RCTImageComponentView ()
@end

@implementation ABI43_0_0RCTImageComponentView {
  ImageShadowNode::ConcreteStateTeller _stateTeller;
  ImageResponseObserverCoordinator const *_coordinator;
  ABI43_0_0RCTImageResponseObserverProxy _imageResponseObserverProxy;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static auto const defaultProps = std::make_shared<ImageProps const>();
    _props = defaultProps;

    _imageView = [[UIImageView alloc] initWithFrame:self.bounds];
    _imageView.clipsToBounds = YES;
    _imageView.contentMode = (UIViewContentMode)ABI43_0_0RCTResizeModeFromImageResizeMode(defaultProps->resizeMode);
    _imageView.layer.minificationFilter = kCAFilterTrilinear;
    _imageView.layer.magnificationFilter = kCAFilterTrilinear;

    _imageResponseObserverProxy = ABI43_0_0RCTImageResponseObserverProxy(self);

    self.contentView = _imageView;
  }

  return self;
}

#pragma mark - ABI43_0_0RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<ImageComponentDescriptor>();
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  auto const &oldImageProps = *std::static_pointer_cast<ImageProps const>(_props);
  auto const &newImageProps = *std::static_pointer_cast<ImageProps const>(props);

  // `resizeMode`
  if (oldImageProps.resizeMode != newImageProps.resizeMode) {
    if (newImageProps.resizeMode == ImageResizeMode::Repeat) {
      // Repeat resize mode is handled by the UIImage. Use scale to fill
      // so the repeated image fills the UIImageView.
      _imageView.contentMode = UIViewContentModeScaleToFill;
    } else {
      _imageView.contentMode = (UIViewContentMode)ABI43_0_0RCTResizeModeFromImageResizeMode(newImageProps.resizeMode);
    }
  }

  // `tintColor`
  if (oldImageProps.tintColor != newImageProps.tintColor) {
    _imageView.tintColor = ABI43_0_0RCTUIColorFromSharedColor(newImageProps.tintColor);
  }

  [super updateProps:props oldProps:oldProps];
}

- (void)updateState:(State::Shared const &)state oldState:(State::Shared const &)oldState
{
  _stateTeller.setConcreteState(state);
  auto _oldState = std::static_pointer_cast<ImageShadowNode::ConcreteState const>(oldState);
  auto data = _stateTeller.getData().value();

  // This call (setting `coordinator`) must be unconditional (at the same block as setting `State`)
  // because the setter stores a raw pointer to object that `State` owns.
  self.coordinator = &data.getImageRequest().getObserverCoordinator();

  bool havePreviousData = _oldState && _oldState->getData().getImageSource() != ImageSource{};

  if (!havePreviousData || data.getImageSource() != _oldState->getData().getImageSource()) {
    // Loading actually starts a little before this, but this is the first time we know
    // the image is loading and can fire an event from this component
    std::static_pointer_cast<ImageEventEmitter const>(_eventEmitter)->onLoadStart();

    // TODO (T58941612): Tracking for visibility should be done directly on this class.
    // For now, we consolidate instrumentation logic in the image loader, so that pre-Fabric gets the same treatment.
  }
}

- (void)setCoordinator:(ImageResponseObserverCoordinator const *)coordinator
{
  if (_coordinator) {
    _coordinator->removeObserver(_imageResponseObserverProxy);
  }
  _coordinator = coordinator;
  if (_coordinator != nullptr) {
    _coordinator->addObserver(_imageResponseObserverProxy);
  }
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  self.coordinator = nullptr;
  _imageView.image = nil;
  _stateTeller.invalidate();
}

- (void)dealloc
{
  self.coordinator = nullptr;
}

#pragma mark - ABI43_0_0RCTImageResponseDelegate

- (void)didReceiveImage:(UIImage *)image metadata:(id)metadata fromObserver:(void const *)observer
{
  if (!_eventEmitter || !_stateTeller.isValid()) {
    // Notifications are delivered asynchronously and might arrive after the view is already recycled.
    // In the future, we should incorporate an `EventEmitter` into a separate object owned by `ImageRequest` or `State`.
    // See for more info: T46311063.
    return;
  }

  std::static_pointer_cast<ImageEventEmitter const>(_eventEmitter)->onLoad();
  std::static_pointer_cast<ImageEventEmitter const>(_eventEmitter)->onLoadEnd();

  const auto &imageProps = *std::static_pointer_cast<ImageProps const>(_props);

  if (imageProps.tintColor) {
    image = [image imageWithRenderingMode:UIImageRenderingModeAlwaysTemplate];
  }

  if (imageProps.resizeMode == ImageResizeMode::Repeat) {
    image = [image resizableImageWithCapInsets:ABI43_0_0RCTUIEdgeInsetsFromEdgeInsets(imageProps.capInsets)
                                  resizingMode:UIImageResizingModeTile];
  } else if (imageProps.capInsets != EdgeInsets()) {
    // Applying capInsets of 0 will switch the "resizingMode" of the image to "tile" which is undesired.
    image = [image resizableImageWithCapInsets:ABI43_0_0RCTUIEdgeInsetsFromEdgeInsets(imageProps.capInsets)
                                  resizingMode:UIImageResizingModeStretch];
  }

  if (imageProps.blurRadius > __FLT_EPSILON__) {
    // Blur on a background thread to avoid blocking interaction.
    CGFloat blurRadius = imageProps.blurRadius;
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
      UIImage *blurredImage = ABI43_0_0RCTBlurredImageWithRadius(image, blurRadius);
      ABI43_0_0RCTExecuteOnMainQueue(^{
        self->_imageView.image = blurredImage;
      });
    });
  } else {
    self->_imageView.image = image;
  }
}

- (void)didReceiveProgress:(float)progress fromObserver:(void const *)observer
{
  if (!_eventEmitter) {
    return;
  }

  std::static_pointer_cast<ImageEventEmitter const>(_eventEmitter)->onProgress(progress);
}

- (void)didReceiveFailureFromObserver:(void const *)observer
{
  _imageView.image = nil;

  if (!_eventEmitter) {
    return;
  }

  std::static_pointer_cast<ImageEventEmitter const>(_eventEmitter)->onError();
  std::static_pointer_cast<ImageEventEmitter const>(_eventEmitter)->onLoadEnd();
}

@end

#ifdef __cplusplus
extern "C" {
#endif

// Can't the import generated Plugin.h because plugins are not in this BUCK target
Class<ABI43_0_0RCTComponentViewProtocol> ABI43_0_0RCTImageCls(void);

#ifdef __cplusplus
}
#endif

Class<ABI43_0_0RCTComponentViewProtocol> ABI43_0_0RCTImageCls(void)
{
  return ABI43_0_0RCTImageComponentView.class;
}

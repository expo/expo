/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI38_0_0RCTImageComponentView.h"

#import <ABI38_0_0React/ABI38_0_0RCTImageResponseDelegate.h>
#import <ABI38_0_0React/ABI38_0_0RCTImageResponseObserverProxy.h>
#import <ABI38_0_0React/components/image/ImageComponentDescriptor.h>
#import <ABI38_0_0React/components/image/ImageEventEmitter.h>
#import <ABI38_0_0React/components/image/ImageLocalData.h>
#import <ABI38_0_0React/components/image/ImageProps.h>
#import <ABI38_0_0React/imagemanager/ImageRequest.h>
#import <ABI38_0_0React/imagemanager/ABI38_0_0RCTImagePrimitivesConversions.h>

#import "ABI38_0_0RCTConversions.h"

@interface ABI38_0_0RCTImageComponentView () <ABI38_0_0RCTImageResponseDelegate>
@end

@implementation ABI38_0_0RCTImageComponentView {
  UIImageView *_imageView;
  SharedImageLocalData _imageLocalData;
  ImageResponseObserverCoordinator const *_coordinator;
  ABI38_0_0RCTImageResponseObserverProxy _imageResponseObserverProxy;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static auto const defaultProps = std::make_shared<ImageProps const>();
    _props = defaultProps;

    _imageView = [[UIImageView alloc] initWithFrame:self.bounds];
    _imageView.clipsToBounds = YES;
    _imageView.contentMode = (UIViewContentMode)ABI38_0_0RCTResizeModeFromImageResizeMode(defaultProps->resizeMode);

    _imageResponseObserverProxy = ABI38_0_0RCTImageResponseObserverProxy(self);

    self.contentView = _imageView;
  }

  return self;
}

#pragma mark - ABI38_0_0RCTComponentViewProtocol

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
      _imageView.contentMode = (UIViewContentMode)ABI38_0_0RCTResizeModeFromImageResizeMode(newImageProps.resizeMode);
    }
  }

  // `tintColor`
  if (oldImageProps.tintColor != newImageProps.tintColor) {
    _imageView.tintColor = [UIColor colorWithCGColor:newImageProps.tintColor.get()];
  }

  [super updateProps:props oldProps:oldProps];
}

- (void)updateLocalData:(SharedLocalData)localData oldLocalData:(SharedLocalData)oldLocalData
{
  auto imageLocalData = std::static_pointer_cast<ImageLocalData const>(localData);

  // This call (setting `coordinator`) must be unconditional (at the same block as setting `LocalData`)
  // because the setter stores a raw pointer to object that `LocalData` owns.
  self.coordinator = imageLocalData ? &imageLocalData->getImageRequest().getObserverCoordinator() : nullptr;

  auto previousData = _imageLocalData;
  _imageLocalData = imageLocalData;

  if (!_imageLocalData) {
    // This might happen in very rare cases (e.g. inside a subtree inside a node with `display: none`).
    // That's quite normal.
    return;
  }

  bool havePreviousData = previousData != nullptr;

  if (!havePreviousData || _imageLocalData->getImageSource() != previousData->getImageSource()) {
    // Loading actually starts a little before this, but this is the first time we know
    // the image is loading and can fire an event from this component
    std::static_pointer_cast<ImageEventEmitter const>(_eventEmitter)->onLoadStart();
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
  _imageLocalData.reset();
}

- (void)dealloc
{
  self.coordinator = nullptr;
}

#pragma mark - ABI38_0_0RCTImageResponseDelegate

- (void)didReceiveImage:(UIImage *)image fromObserver:(void const *)observer
{
  if (!_eventEmitter) {
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
    image = [image resizableImageWithCapInsets:ABI38_0_0RCTUIEdgeInsetsFromEdgeInsets(imageProps.capInsets)
                                  resizingMode:UIImageResizingModeTile];
  } else if (imageProps.capInsets != EdgeInsets()) {
    // Applying capInsets of 0 will switch the "resizingMode" of the image to "tile" which is undesired.
    image = [image resizableImageWithCapInsets:ABI38_0_0RCTUIEdgeInsetsFromEdgeInsets(imageProps.capInsets)
                                  resizingMode:UIImageResizingModeStretch];
  }

  self->_imageView.image = image;

  // Apply trilinear filtering to smooth out mis-sized images.
  self->_imageView.layer.minificationFilter = kCAFilterTrilinear;
  self->_imageView.layer.magnificationFilter = kCAFilterTrilinear;
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

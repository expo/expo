/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI34_0_0RCTImageComponentView.h"

#import <ReactABI34_0_0/components/image/ImageEventEmitter.h>
#import <ReactABI34_0_0/components/image/ImageLocalData.h>
#import <ReactABI34_0_0/components/image/ImageProps.h>
#import <ReactABI34_0_0/components/image/ImageShadowNode.h>
#import <ReactABI34_0_0/imagemanager/ImageRequest.h>
#import <ReactABI34_0_0/imagemanager/ABI34_0_0RCTImagePrimitivesConversions.h>
#import <ReactABI34_0_0/ABI34_0_0RCTImageResponseObserverProxy.h>

#import "ABI34_0_0RCTConversions.h"
#import "ABI34_0_0MainQueueExecutor.h"

@implementation ABI34_0_0RCTImageComponentView {
  UIImageView *_imageView;
  SharedImageLocalData _imageLocalData;
  const ImageResponseObserverCoordinator *_coordinator;
  std::unique_ptr<ABI34_0_0RCTImageResponseObserverProxy> _imageResponseObserverProxy;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ImageProps>();
    _props = defaultProps;

    _imageView = [[UIImageView alloc] initWithFrame:self.bounds];
    _imageView.clipsToBounds = YES;

    _imageView.contentMode = (UIViewContentMode)ABI34_0_0RCTResizeModeFromImageResizeMode(defaultProps->resizeMode);
      
    _imageResponseObserverProxy = std::make_unique<ABI34_0_0RCTImageResponseObserverProxy>((__bridge void *)self);

    self.contentView = _imageView;
  }

  return self;
}

#pragma mark - ABI34_0_0RCTComponentViewProtocol

+ (ComponentHandle)componentHandle
{
  return ImageShadowNode::Handle();
}

- (void)updateProps:(SharedProps)props oldProps:(SharedProps)oldProps
{
  const auto &oldImageProps = *std::static_pointer_cast<const ImageProps>(oldProps ?: _props);
  const auto &newImageProps = *std::static_pointer_cast<const ImageProps>(props);

  [super updateProps:props oldProps:oldProps];

  // `resizeMode`
  if (oldImageProps.resizeMode != newImageProps.resizeMode) {
    if (newImageProps.resizeMode == ImageResizeMode::Repeat) {
      // Repeat resize mode is handled by the UIImage. Use scale to fill
      // so the repeated image fills the UIImageView.
      _imageView.contentMode = UIViewContentModeScaleToFill;
    } else {
      _imageView.contentMode = (UIViewContentMode)ABI34_0_0RCTResizeModeFromImageResizeMode(newImageProps.resizeMode);
    }
  }

  // `tintColor`
  if (oldImageProps.tintColor != newImageProps.tintColor) {
    _imageView.tintColor = [UIColor colorWithCGColor:newImageProps.tintColor.get()];
  }
}

- (void)updateLocalData:(SharedLocalData)localData
           oldLocalData:(SharedLocalData)oldLocalData
{
  SharedImageLocalData previousData = _imageLocalData;
  _imageLocalData = std::static_pointer_cast<const ImageLocalData>(localData);
  assert(_imageLocalData);
  bool havePreviousData = previousData != nullptr;
  
  if (!havePreviousData || _imageLocalData->getImageSource() != previousData->getImageSource()) {
    self.coordinator = _imageLocalData->getImageRequest().getObserverCoordinator();
    
    // Loading actually starts a little before this, but this is the first time we know
    // the image is loading and can fire an event from this component
    std::static_pointer_cast<const ImageEventEmitter>(_eventEmitter)->onLoadStart();
  }
}

- (void)setCoordinator:(const ImageResponseObserverCoordinator *)coordinator {
  if (_coordinator) {
    _coordinator->removeObserver(_imageResponseObserverProxy.get());
  }
  _coordinator = coordinator;
  if (_coordinator != nullptr) {
    _coordinator->addObserver(_imageResponseObserverProxy.get());
  }
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  self.coordinator = nullptr;
  _imageView.image = nil;
  _imageLocalData.reset();
}

-(void)dealloc
{
  self.coordinator = nullptr;
  _imageResponseObserverProxy.reset();
}

#pragma mark - ABI34_0_0RCTImageResponseDelegate

- (void)didReceiveImage:(UIImage *)image fromObserver:(void*)observer
{
  std::static_pointer_cast<const ImageEventEmitter>(_eventEmitter)->onLoad();

  const auto &imageProps = *std::static_pointer_cast<const ImageProps>(_props);

  if (imageProps.tintColor) {
    image = [image imageWithRenderingMode:UIImageRenderingModeAlwaysTemplate];
  }

  if (imageProps.resizeMode == ImageResizeMode::Repeat) {
    image = [image resizableImageWithCapInsets:ABI34_0_0RCTUIEdgeInsetsFromEdgeInsets(imageProps.capInsets)
                                  resizingMode:UIImageResizingModeTile];
  } else if (imageProps.capInsets != EdgeInsets()) {
    // Applying capInsets of 0 will switch the "resizingMode" of the image to "tile" which is undesired.
    image = [image resizableImageWithCapInsets:ABI34_0_0RCTUIEdgeInsetsFromEdgeInsets(imageProps.capInsets)
                                  resizingMode:UIImageResizingModeStretch];
  }

  self->_imageView.image = image;
  
  // Apply trilinear filtering to smooth out mis-sized images.
  self->_imageView.layer.minificationFilter = kCAFilterTrilinear;
  self->_imageView.layer.magnificationFilter = kCAFilterTrilinear;

  std::static_pointer_cast<const ImageEventEmitter>(self->_eventEmitter)->onLoadEnd();
}

- (void)didReceiveProgress:(float)progress fromObserver:(void*)observer {
  std::static_pointer_cast<const ImageEventEmitter>(_eventEmitter)->onProgress(progress);
}

- (void)didReceiveFailureFromObserver:(void*)observer {
  std::static_pointer_cast<const ImageEventEmitter>(_eventEmitter)->onError();
}


@end

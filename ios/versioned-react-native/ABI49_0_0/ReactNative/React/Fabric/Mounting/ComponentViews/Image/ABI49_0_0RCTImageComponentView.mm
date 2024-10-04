/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RCTImageComponentView.h"

#import <ABI49_0_0React/ABI49_0_0RCTAssert.h>
#import <ABI49_0_0React/ABI49_0_0RCTConversions.h>
#import <ABI49_0_0React/ABI49_0_0RCTImageBlurUtils.h>
#import <ABI49_0_0React/ABI49_0_0RCTImageResponseObserverProxy.h>
#import <ABI49_0_0React/ABI49_0_0renderer/components/image/ImageComponentDescriptor.h>
#import <ABI49_0_0React/ABI49_0_0renderer/components/image/ImageEventEmitter.h>
#import <ABI49_0_0React/ABI49_0_0renderer/components/image/ImageProps.h>
#import <ABI49_0_0React/renderer/core/ABI49_0_0CoreFeatures.h>
#import <ABI49_0_0React/renderer/imagemanager/ABI49_0_0ImageRequest.h>
#import <ABI49_0_0React/renderer/imagemanager/ABI49_0_0RCTImagePrimitivesConversions.h>

using namespace ABI49_0_0facebook::ABI49_0_0React;

@implementation ABI49_0_0RCTImageComponentView {
  ImageShadowNode::ConcreteState::Shared _state;
  ABI49_0_0RCTImageResponseObserverProxy _imageResponseObserverProxy;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static auto const defaultProps = std::make_shared<ImageProps const>();
    _props = defaultProps;

    _imageView = [ABI49_0_0RCTUIImageViewAnimated new];
    _imageView.clipsToBounds = YES;
    _imageView.contentMode = ABI49_0_0RCTContentModeFromImageResizeMode(defaultProps->resizeMode);
    _imageView.layer.minificationFilter = kCAFilterTrilinear;
    _imageView.layer.magnificationFilter = kCAFilterTrilinear;

    _imageResponseObserverProxy = ABI49_0_0RCTImageResponseObserverProxy(self);

    self.contentView = _imageView;
  }

  return self;
}

#pragma mark - ABI49_0_0RCTComponentViewProtocol

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
    _imageView.contentMode = ABI49_0_0RCTContentModeFromImageResizeMode(newImageProps.resizeMode);
  }

  // `tintColor`
  if (oldImageProps.tintColor != newImageProps.tintColor) {
    _imageView.tintColor = ABI49_0_0RCTUIColorFromSharedColor(newImageProps.tintColor);
  }

  [super updateProps:props oldProps:oldProps];
}

- (void)updateState:(State::Shared const &)state oldState:(State::Shared const &)oldState
{
  ABI49_0_0RCTAssert(state, @"`state` must not be null.");
  ABI49_0_0RCTAssert(
      std::dynamic_pointer_cast<ImageShadowNode::ConcreteState const>(state),
      @"`state` must be a pointer to `ImageShadowNode::ConcreteState`.");

  auto oldImageState = std::static_pointer_cast<ImageShadowNode::ConcreteState const>(_state);
  auto newImageState = std::static_pointer_cast<ImageShadowNode::ConcreteState const>(state);

  [self _setStateAndResubscribeImageResponseObserver:newImageState];

  bool havePreviousData = oldImageState && oldImageState->getData().getImageSource() != ImageSource{};

  if (!havePreviousData ||
      (newImageState && newImageState->getData().getImageSource() != oldImageState->getData().getImageSource())) {
    // Loading actually starts a little before this, but this is the first time we know
    // the image is loading and can fire an event from this component
    std::static_pointer_cast<ImageEventEmitter const>(_eventEmitter)->onLoadStart();

    // TODO (T58941612): Tracking for visibility should be done directly on this class.
    // For now, we consolidate instrumentation logic in the image loader, so that pre-Fabric gets the same treatment.
  }
}

- (void)_setStateAndResubscribeImageResponseObserver:(ImageShadowNode::ConcreteState::Shared const &)state
{
  if (_state) {
    auto const &imageRequest = _state->getData().getImageRequest();
    auto &observerCoordinator = imageRequest.getObserverCoordinator();
    observerCoordinator.removeObserver(_imageResponseObserverProxy);
    if (CoreFeatures::cancelImageDownloadsOnRecycle) {
      // Cancelling image request because we are no longer observing it.
      // This is not 100% correct place to do this because we may want to
      // re-create ABI49_0_0RCTImageComponentView with the same image and if it
      // was cancelled before downloaded, download is not resumed.
      // This will only become issue if we decouple life cycle of a
      // ShadowNode from ComponentView, which is not something we do now.
      imageRequest.cancel();
      imageRequest.cancel();
      imageRequest.cancel();
      imageRequest.cancel();
    }
  }

  _state = state;

  if (_state) {
    auto &observerCoordinator = _state->getData().getImageRequest().getObserverCoordinator();
    observerCoordinator.addObserver(_imageResponseObserverProxy);
  }
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  [self _setStateAndResubscribeImageResponseObserver:nullptr];
  _imageView.image = nil;
}

#pragma mark - ABI49_0_0RCTImageResponseDelegate

- (void)didReceiveImage:(UIImage *)image metadata:(id)metadata fromObserver:(void const *)observer
{
  if (!_eventEmitter || !_state) {
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
    image = [image resizableImageWithCapInsets:ABI49_0_0RCTUIEdgeInsetsFromEdgeInsets(imageProps.capInsets)
                                  resizingMode:UIImageResizingModeTile];
  } else if (imageProps.capInsets != EdgeInsets()) {
    // Applying capInsets of 0 will switch the "resizingMode" of the image to "tile" which is undesired.
    image = [image resizableImageWithCapInsets:ABI49_0_0RCTUIEdgeInsetsFromEdgeInsets(imageProps.capInsets)
                                  resizingMode:UIImageResizingModeStretch];
  }

  if (imageProps.blurRadius > __FLT_EPSILON__) {
    // Blur on a background thread to avoid blocking interaction.
    CGFloat blurRadius = imageProps.blurRadius;
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
      UIImage *blurredImage = ABI49_0_0RCTBlurredImageWithRadius(image, blurRadius);
      ABI49_0_0RCTExecuteOnMainQueue(^{
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
Class<ABI49_0_0RCTComponentViewProtocol> ABI49_0_0RCTImageCls(void);

#ifdef __cplusplus
}
#endif

Class<ABI49_0_0RCTComponentViewProtocol> ABI49_0_0RCTImageCls(void)
{
  return ABI49_0_0RCTImageComponentView.class;
}

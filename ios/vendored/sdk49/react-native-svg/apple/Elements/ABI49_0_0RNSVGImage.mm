/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RNSVGImage.h"
#import "ABI49_0_0RCTConvert+RNSVG.h"

#if __has_include(<ABI49_0_0React/ABI49_0_0RCTImageLoader.h>)

#import <ABI49_0_0React/ABI49_0_0RCTImageLoader.h>

#else

#import <ABI49_0_0React/ABI49_0_0RCTImageLoaderProtocol.h>
#import <ABI49_0_0React/ABI49_0_0RCTImageShadowView.h>
#import <ABI49_0_0React/ABI49_0_0RCTImageURLLoader.h>
#import <ABI49_0_0React/ABI49_0_0RCTImageView.h>

#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED

#import <ABI49_0_0React/ABI49_0_0RCTBridge.h>
#import <ABI49_0_0React/ABI49_0_0RCTLog.h>
#import "ABI49_0_0RNSVGViewBox.h"

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
#import <ABI49_0_0React/ABI49_0_0RCTConversions.h>
#import <ABI49_0_0React/ABI49_0_0RCTFabricComponentsPlugins.h>
#import <ABI49_0_0React/ABI49_0_0RCTImageResponseObserverProxy.h>
#import <ABI49_0_0React/ABI49_0_0RCTImageSource.h>
#import <react/renderer/components/rnsvg/ComponentDescriptors.h>
#import <react/renderer/components/view/conversions.h>
#import <react/renderer/imagemanager/ABI49_0_0RCTImagePrimitivesConversions.h>
#import <rnsvg/ABI49_0_0RNSVGImageComponentDescriptor.h>
#import "ABI49_0_0RNSVGFabricConversions.h"

using namespace ABI49_0_0facebook::ABI49_0_0React;
#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED

@implementation ABI49_0_0RNSVGImage {
  CGImageRef _image;
  CGSize _imageSize;
  ABI49_0_0RCTImageLoaderCancellationBlock _reloadImageCancellationBlock;

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
  ABI49_0_0RNSVGImageShadowNode::ConcreteState::Shared _state;
  ABI49_0_0RCTImageResponseObserverProxy _imageResponseObserverProxy;
#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED
}
#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ABI49_0_0RNSVGImageProps>();
    _props = defaultProps;

    _imageResponseObserverProxy = ABI49_0_0RCTImageResponseObserverProxy(self);
  }
  return self;
}

#pragma mark - ABI49_0_0RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<ABI49_0_0RNSVGImageComponentDescriptor>();
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &newProps = *std::static_pointer_cast<const ABI49_0_0RNSVGImageProps>(props);

  self.x = [ABI49_0_0RNSVGLength lengthWithString:ABI49_0_0RCTNSStringFromString(newProps.x)];
  self.y = [ABI49_0_0RNSVGLength lengthWithString:ABI49_0_0RCTNSStringFromString(newProps.y)];
  if (ABI49_0_0RCTNSStringFromStringNilIfEmpty(newProps.height)) {
    self.imageheight = [ABI49_0_0RNSVGLength lengthWithString:ABI49_0_0RCTNSStringFromString(newProps.height)];
  }
  if (ABI49_0_0RCTNSStringFromStringNilIfEmpty(newProps.width)) {
    self.imagewidth = [ABI49_0_0RNSVGLength lengthWithString:ABI49_0_0RCTNSStringFromString(newProps.width)];
  }
  self.align = ABI49_0_0RCTNSStringFromStringNilIfEmpty(newProps.align);
  self.meetOrSlice = intToRNSVGVBMOS(newProps.meetOrSlice);

  setCommonRenderableProps(newProps, self);
  _props = std::static_pointer_cast<ABI49_0_0RNSVGImageProps const>(props);
}

- (void)updateState:(State::Shared const &)state oldState:(State::Shared const &)oldState
{
  ABI49_0_0RCTAssert(state, @"`state` must not be null.");
  ABI49_0_0RCTAssert(
      std::dynamic_pointer_cast<ABI49_0_0RNSVGImageShadowNode::ConcreteState const>(state),
      @"`state` must be a pointer to `ABI49_0_0RNSVGImageShadowNode::ConcreteState`.");

  auto oldImageState = std::static_pointer_cast<ABI49_0_0RNSVGImageShadowNode::ConcreteState const>(_state);
  auto newImageState = std::static_pointer_cast<ABI49_0_0RNSVGImageShadowNode::ConcreteState const>(state);

  [self _setStateAndResubscribeImageResponseObserver:newImageState];
}

- (void)_setStateAndResubscribeImageResponseObserver:(ABI49_0_0RNSVGImageShadowNode::ConcreteState::Shared const &)state
{
  if (_state) {
    auto &observerCoordinator = _state->getData().getImageRequest().getObserverCoordinator();
    observerCoordinator.removeObserver(_imageResponseObserverProxy);
  }

  _state = state;

  if (_state) {
    auto &observerCoordinator = _state->getData().getImageRequest().getObserverCoordinator();
    observerCoordinator.addObserver(_imageResponseObserverProxy);
  }
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
  dispatch_async(dispatch_get_main_queue(), ^{
    self->_image = CGImageRetain(image.CGImage);
    self->_imageSize = CGSizeMake(CGImageGetWidth(self->_image), CGImageGetHeight(self->_image));
    [self invalidate];
  });
}

- (void)didReceiveProgress:(float)progress fromObserver:(void const *)observer
{
}

- (void)didReceiveFailureFromObserver:(void const *)observer
{
  if (_image) {
    CGImageRelease(_image);
  }
  _image = nil;
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  [self _setStateAndResubscribeImageResponseObserver:nullptr];

  _x = nil;
  _y = nil;
  _imageheight = nil;
  _imagewidth = nil;
  _src = nil;
  _align = nil;
  _meetOrSlice = kRNSVGVBMOSMeet;

  if (_image) {
    CGImageRelease(_image);
  }
  _image = nil;
  _imageSize = CGSizeZero;
  _reloadImageCancellationBlock = nil;
}
#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED

- (void)setSrc:(ABI49_0_0RCTImageSource *)src
{
#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
#else
  if (src == _src) {
    return;
  }
  _src = src;
  CGImageRelease(_image);
  _image = nil;
  if (src.size.width != 0 && src.size.height != 0) {
    _imageSize = src.size;
  } else {
    _imageSize = CGSizeMake(0, 0);
  }

  ABI49_0_0RCTImageLoaderCancellationBlock previousCancellationBlock = _reloadImageCancellationBlock;
  if (previousCancellationBlock) {
    previousCancellationBlock();
    _reloadImageCancellationBlock = nil;
  }

  _reloadImageCancellationBlock = [[self.bridge moduleForName:@"ImageLoader"]
      loadImageWithURLRequest:src.request
                     callback:^(NSError *error, UIImage *image) {
                       dispatch_async(dispatch_get_main_queue(), ^{
                         self->_image = CGImageRetain(image.CGImage);
                         self->_imageSize = CGSizeMake(CGImageGetWidth(self->_image), CGImageGetHeight(self->_image));
                         [self invalidate];
                       });
                     }];
#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED
}

- (void)setX:(ABI49_0_0RNSVGLength *)x
{
  if ([x isEqualTo:_x]) {
    return;
  }
  [self invalidate];
  _x = x;
}

- (void)setY:(ABI49_0_0RNSVGLength *)y
{
  if ([y isEqualTo:_y]) {
    return;
  }
  [self invalidate];
  _y = y;
}

- (void)setImagewidth:(ABI49_0_0RNSVGLength *)width
{
  if ([width isEqualTo:_imagewidth]) {
    return;
  }
  [self invalidate];
  _imagewidth = width;
}

- (void)setImageheight:(ABI49_0_0RNSVGLength *)height
{
  if ([height isEqualTo:_imageheight]) {
    return;
  }
  [self invalidate];
  _imageheight = height;
}

- (void)setAlign:(NSString *)align
{
  if ([align isEqualToString:_align]) {
    return;
  }
  [self invalidate];
  _align = align;
}

- (void)setMeetOrSlice:(ABI49_0_0RNSVGVBMOS)meetOrSlice
{
  if (meetOrSlice == _meetOrSlice) {
    return;
  }
  [self invalidate];
  _meetOrSlice = meetOrSlice;
}

- (void)dealloc
{
  CGImageRelease(_image);
}

- (void)renderLayerTo:(CGContextRef)context rect:(CGRect)rect
{
  if (CGSizeEqualToSize(CGSizeZero, _imageSize)) {
    return;
  }
  CGContextSaveGState(context);

  // add hit area
  CGRect hitArea = [self getHitArea];
  CGPathRef hitAreaPath = CGPathCreateWithRect(hitArea, nil);
  [self setHitArea:hitAreaPath];
  CGPathRelease(hitAreaPath);
  self.pathBounds = hitArea;
  self.fillBounds = hitArea;
  self.strokeBounds = hitArea;

  // apply viewBox transform on Image render.
  CGRect imageBounds = CGRectMake(0, 0, _imageSize.width, _imageSize.height);
  CGAffineTransform viewbox = [ABI49_0_0RNSVGViewBox getTransform:imageBounds
                                                   eRect:hitArea
                                                   align:self.align
                                             meetOrSlice:self.meetOrSlice];

  [self clip:context];
  CGContextClipToRect(context, hitArea);
  CGContextConcatCTM(context, viewbox);
  CGContextTranslateCTM(context, 0, imageBounds.size.height);
  CGContextScaleCTM(context, 1, -1);
  CGContextDrawImage(context, imageBounds, _image);
  CGContextRestoreGState(context);

  CGRect bounds = hitArea;
  self.clientRect = bounds;

  CGAffineTransform current = CGContextGetCTM(context);
  CGAffineTransform svgToClientTransform = CGAffineTransformConcat(current, self.svgView.invInitialCTM);

  self.ctm = svgToClientTransform;
  self.screenCTM = current;

  CGAffineTransform transform = CGAffineTransformConcat(self.matrix, self.transforms);
  CGPoint mid = CGPointMake(CGRectGetMidX(bounds), CGRectGetMidY(bounds));
  CGPoint center = CGPointApplyAffineTransform(mid, transform);

  self.bounds = bounds;
  if (!isnan(center.x) && !isnan(center.y)) {
    self.center = center;
  }
  self.frame = bounds;
}

- (CGRect)getHitArea
{
  CGFloat x = [self relativeOnWidth:self.x];
  CGFloat y = [self relativeOnHeight:self.y];
  CGFloat width = [self relativeOnWidth:self.imagewidth];
  CGFloat height = [self relativeOnHeight:self.imageheight];
  if (width == 0) {
    width = _imageSize.width;
  }
  if (height == 0) {
    height = _imageSize.height;
  }

  return CGRectMake(x, y, width, height);
}

- (CGPathRef)getPath:(CGContextRef)context
{
  return (CGPathRef)CFAutorelease(CGPathCreateWithRect([self getHitArea], nil));
}

@end

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
Class<ABI49_0_0RCTComponentViewProtocol> ABI49_0_0RNSVGImageCls(void)
{
  return ABI49_0_0RNSVGImage.class;
}
#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED

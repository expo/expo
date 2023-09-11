/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGImage.h"
#import "RCTConvert+RNSVG.h"

#if __has_include(<React/RCTImageLoader.h>)

#import <React/RCTImageLoader.h>

#else

#import <React/RCTImageLoaderProtocol.h>
#import <React/RCTImageShadowView.h>
#import <React/RCTImageURLLoader.h>
#import <React/RCTImageView.h>

#endif // RCT_NEW_ARCH_ENABLED

#import <React/RCTBridge.h>
#import <React/RCTLog.h>
#import "RNSVGViewBox.h"

#ifdef RCT_NEW_ARCH_ENABLED
#import <React/RCTConversions.h>
#import <React/RCTFabricComponentsPlugins.h>
#import <React/RCTImageResponseObserverProxy.h>
#import <React/RCTImageSource.h>
#import <react/renderer/components/rnsvg/ComponentDescriptors.h>
#import <react/renderer/components/view/conversions.h>
#import <react/renderer/imagemanager/RCTImagePrimitivesConversions.h>
#import <rnsvg/RNSVGImageComponentDescriptor.h>
#import "RNSVGFabricConversions.h"

using namespace facebook::react;
#endif // RCT_NEW_ARCH_ENABLED

@implementation RNSVGImage {
  CGImageRef _image;
  CGSize _imageSize;
  RCTImageLoaderCancellationBlock _reloadImageCancellationBlock;

#ifdef RCT_NEW_ARCH_ENABLED
  RNSVGImageShadowNode::ConcreteState::Shared _state;
  RCTImageResponseObserverProxy _imageResponseObserverProxy;
#endif // RCT_NEW_ARCH_ENABLED
}
#ifdef RCT_NEW_ARCH_ENABLED

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const RNSVGImageProps>();
    _props = defaultProps;

    _imageResponseObserverProxy = RCTImageResponseObserverProxy(self);
  }
  return self;
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<RNSVGImageComponentDescriptor>();
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &newProps = *std::static_pointer_cast<const RNSVGImageProps>(props);

  self.x = [RNSVGLength lengthWithString:RCTNSStringFromString(newProps.x)];
  self.y = [RNSVGLength lengthWithString:RCTNSStringFromString(newProps.y)];
  if (RCTNSStringFromStringNilIfEmpty(newProps.height)) {
    self.imageheight = [RNSVGLength lengthWithString:RCTNSStringFromString(newProps.height)];
  }
  if (RCTNSStringFromStringNilIfEmpty(newProps.width)) {
    self.imagewidth = [RNSVGLength lengthWithString:RCTNSStringFromString(newProps.width)];
  }
  self.align = RCTNSStringFromStringNilIfEmpty(newProps.align);
  self.meetOrSlice = intToRNSVGVBMOS(newProps.meetOrSlice);

  setCommonRenderableProps(newProps, self);
  _props = std::static_pointer_cast<RNSVGImageProps const>(props);
}

- (void)updateState:(State::Shared const &)state oldState:(State::Shared const &)oldState
{
  RCTAssert(state, @"`state` must not be null.");
  RCTAssert(
      std::dynamic_pointer_cast<RNSVGImageShadowNode::ConcreteState const>(state),
      @"`state` must be a pointer to `RNSVGImageShadowNode::ConcreteState`.");

  auto oldImageState = std::static_pointer_cast<RNSVGImageShadowNode::ConcreteState const>(_state);
  auto newImageState = std::static_pointer_cast<RNSVGImageShadowNode::ConcreteState const>(state);

  [self _setStateAndResubscribeImageResponseObserver:newImageState];
}

- (void)_setStateAndResubscribeImageResponseObserver:(RNSVGImageShadowNode::ConcreteState::Shared const &)state
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

#pragma mark - RCTImageResponseDelegate

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
#endif // RCT_NEW_ARCH_ENABLED

- (void)setSrc:(RCTImageSource *)src
{
#ifdef RCT_NEW_ARCH_ENABLED
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

  RCTImageLoaderCancellationBlock previousCancellationBlock = _reloadImageCancellationBlock;
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
#endif // RCT_NEW_ARCH_ENABLED
}

- (void)setX:(RNSVGLength *)x
{
  if ([x isEqualTo:_x]) {
    return;
  }
  [self invalidate];
  _x = x;
}

- (void)setY:(RNSVGLength *)y
{
  if ([y isEqualTo:_y]) {
    return;
  }
  [self invalidate];
  _y = y;
}

- (void)setImagewidth:(RNSVGLength *)width
{
  if ([width isEqualTo:_imagewidth]) {
    return;
  }
  [self invalidate];
  _imagewidth = width;
}

- (void)setImageheight:(RNSVGLength *)height
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

- (void)setMeetOrSlice:(RNSVGVBMOS)meetOrSlice
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
  CGAffineTransform viewbox = [RNSVGViewBox getTransform:imageBounds
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

#ifdef RCT_NEW_ARCH_ENABLED
Class<RCTComponentViewProtocol> RNSVGImageCls(void)
{
  return RNSVGImage.class;
}
#endif // RCT_NEW_ARCH_ENABLED

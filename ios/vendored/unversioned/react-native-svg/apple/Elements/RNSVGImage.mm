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

#endif // RN_FABRIC_ENABLED

#import <React/RCTBridge.h>
#import <React/RCTLog.h>
#import "RNSVGViewBox.h"

#ifdef RN_FABRIC_ENABLED
#import <React/RCTConversions.h>
#import <React/RCTFabricComponentsPlugins.h>
#import <React/RCTImageSource.h>
#import <react/renderer/components/rnsvg/ComponentDescriptors.h>
#import <react/renderer/components/view/conversions.h>
#import <react/renderer/imagemanager/RCTImagePrimitivesConversions.h>
#import "RNSVGFabricConversions.h"

// Some RN private method hacking below similar to how it is done in RNScreens:
// https://github.com/software-mansion/react-native-screens/blob/90e548739f35b5ded2524a9d6410033fc233f586/ios/RNSScreenStackHeaderConfig.mm#L30
@interface RCTBridge (Private)
+ (RCTBridge *)currentBridge;
@end

#endif // RN_FABRIC_ENABLED

@implementation RNSVGImage {
  CGImageRef _image;
  CGSize _imageSize;
  RCTImageLoaderCancellationBlock _reloadImageCancellationBlock;
}
#ifdef RN_FABRIC_ENABLED
using namespace facebook::react;

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const RNSVGImageProps>();
    _props = defaultProps;
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
  const auto &oldImageProps = *std::static_pointer_cast<const RNSVGImageProps>(oldProps);

  self.x = [RNSVGLength lengthWithString:RCTNSStringFromString(newProps.x)];
  self.y = [RNSVGLength lengthWithString:RCTNSStringFromString(newProps.y)];
  if (RCTNSStringFromStringNilIfEmpty(newProps.height)) {
    self.imageheight = [RNSVGLength lengthWithString:RCTNSStringFromString(newProps.height)];
  }
  if (RCTNSStringFromStringNilIfEmpty(newProps.width)) {
    self.imagewidth = [RNSVGLength lengthWithString:RCTNSStringFromString(newProps.width)];
  }

  if (oldProps == nullptr || oldImageProps.src != newProps.src) {
    // TODO: make it the same as in e.g. slider
    NSURLRequest *request = NSURLRequestFromImageSource(newProps.src);
    CGSize size = RCTCGSizeFromSize(newProps.src.size);
    CGFloat scale = newProps.src.scale;
    RCTImageSource *imageSource = [[RCTImageSource alloc] initWithURLRequest:request size:size scale:scale];
    [self setImageSrc:imageSource request:request];
  }
  self.align = RCTNSStringFromStringNilIfEmpty(newProps.align);
  self.meetOrSlice = intToRNSVGVBMOS(newProps.meetOrSlice);

  setCommonRenderableProps(newProps, self);
  _props = std::static_pointer_cast<RNSVGImageProps const>(props);
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
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
#endif // RN_FABRIC_ENABLED

- (void)setImageSrc:(RCTImageSource *)src request:(NSURLRequest *)request
{
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

  _reloadImageCancellationBlock = [[
#ifdef RN_FABRIC_ENABLED
        [RCTBridge currentBridge]
#else
        self.bridge
#endif // RN_FABRIC_ENABLED
        moduleForName:@"ImageLoader"] loadImageWithURLRequest:request callback:^(NSError *error, UIImage *image) {
        dispatch_async(dispatch_get_main_queue(), ^{
            self->_image = CGImageRetain(image.CGImage);
            self->_imageSize = CGSizeMake(CGImageGetWidth(self->_image), CGImageGetHeight(self->_image));
            [self invalidate];
        });
    }];
}

- (void)setSrc:(RCTImageSource *)src
{
  [self setImageSrc:src request:src.request];
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

#ifdef RN_FABRIC_ENABLED
Class<RCTComponentViewProtocol> RNSVGImageCls(void)
{
  return RNSVGImage.class;
}
#endif // RN_FABRIC_ENABLED

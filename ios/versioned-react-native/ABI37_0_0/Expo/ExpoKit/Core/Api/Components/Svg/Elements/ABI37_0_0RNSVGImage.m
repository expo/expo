/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI37_0_0RNSVGImage.h"
#import "ABI37_0_0RCTConvert+RNSVG.h"
#import <ABI37_0_0React/ABI37_0_0RCTImageSource.h>

#if __has_include(<ABI37_0_0React/ABI37_0_0RCTImageLoader.h>)

#import <ABI37_0_0React/ABI37_0_0RCTImageLoader.h>

#else

#import <ABI37_0_0React/ABI37_0_0RCTImageURLLoader.h>
#import <ABI37_0_0React/ABI37_0_0RCTImageShadowView.h>
#import <ABI37_0_0React/ABI37_0_0RCTImageView.h>
#import <ABI37_0_0React/ABI37_0_0RCTImageLoaderProtocol.h>

#endif

#import <ABI37_0_0React/ABI37_0_0RCTLog.h>
#import "ABI37_0_0RNSVGViewBox.h"

@implementation ABI37_0_0RNSVGImage
{
    CGImageRef _image;
    CGSize _imageSize;
    ABI37_0_0RCTImageLoaderCancellationBlock _reloadImageCancellationBlock;
}

- (void)setSrc:(id)src
{
    if (src == _src) {
        return;
    }
    _src = src;
    CGImageRelease(_image);
    ABI37_0_0RCTImageSource *source = [ABI37_0_0RCTConvert ABI37_0_0RCTImageSource:src];
    if (source.size.width != 0 && source.size.height != 0) {
        _imageSize = source.size;
    } else {
        _imageSize = CGSizeMake(0, 0);
    }

    ABI37_0_0RCTImageLoaderCancellationBlock previousCancellationBlock = _reloadImageCancellationBlock;
    if (previousCancellationBlock) {
        previousCancellationBlock();
        _reloadImageCancellationBlock = nil;
    }

    _reloadImageCancellationBlock = [[self.bridge moduleForName:@"ImageLoader"] loadImageWithURLRequest:[ABI37_0_0RCTConvert NSURLRequest:src] callback:^(NSError *error, UIImage *image) {
        dispatch_async(dispatch_get_main_queue(), ^{
            self->_image = CGImageRetain(image.CGImage);
            self->_imageSize = CGSizeMake(CGImageGetWidth(self->_image), CGImageGetHeight(self->_image));
            [self invalidate];
        });
    }];
}

- (void)setX:(ABI37_0_0RNSVGLength *)x
{
    if ([x isEqualTo:_x]) {
        return;
    }
    [self invalidate];
    _x = x;
}

- (void)setY:(ABI37_0_0RNSVGLength *)y
{
    if ([y isEqualTo:_y]) {
        return;
    }
    [self invalidate];
    _y = y;
}

- (void)setImagewidth:(ABI37_0_0RNSVGLength *)width
{
    if ([width isEqualTo:_imagewidth]) {
        return;
    }
    [self invalidate];
    _imagewidth = width;
}

- (void)setImageheight:(ABI37_0_0RNSVGLength *)height
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

- (void)setMeetOrSlice:(ABI37_0_0RNSVGVBMOS)meetOrSlice
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
    CGAffineTransform viewbox = [ABI37_0_0RNSVGViewBox getTransform:imageBounds eRect:hitArea align:self.align meetOrSlice:self.meetOrSlice];

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

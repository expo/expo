/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGImage.h"
#import "RCTConvert+RNSVG.h"
#import <React/RCTImageSource.h>
#import <React/RCTLog.h>
#import "RNSVGViewBox.h"

@implementation RNSVGImage
{
    CGImageRef _image;
    CGSize _imageSize;
}

- (void)setSrc:(id)src
{
    if (src == _src) {
        return;
    }
    _src = src;
    CGImageRelease(_image);
    _image = CGImageRetain([RCTConvert CGImage:src]);
    RCTImageSource *source = [RCTConvert RCTImageSource:src];
    if (source.size.width != 0 && source.size.height != 0) {
        _imageSize = source.size;
    } else {
        _imageSize = CGSizeMake(CGImageGetWidth(_image), CGImageGetHeight(_image));
    }
    [self invalidate];
}

- (void)setX:(NSString *)x
{
    if (x == _x) {
        return;
    }
    [self invalidate];
    _x = x;
}

- (void)setY:(NSString *)y
{
    if (y == _y) {
        return;
    }
    [self invalidate];
    _y = y;
}

- (void)setWidth:(NSString *)width
{
    if (width == _width) {
        return;
    }
    [self invalidate];
    _width = width;
}

- (void)setHeight:(NSString *)height
{
    if (height == _height) {
        return;
    }
    [self invalidate];
    _height = height;
}

- (void)setAlign:(NSString *)align
{
    if (align == _align) {
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

- (void)renderLayerTo:(CGContextRef)context
{
    CGContextSaveGState(context);

    // add hit area
    CGRect hitArea = [self getHitArea];
    CGPathRef hitAreaPath = CGPathCreateWithRect(hitArea, nil);
    [self setHitArea:hitAreaPath];
    CGPathRelease(hitAreaPath);

    // apply viewBox transform on Image render.
    CGRect imageBounds = CGRectMake(0, 0, _imageSize.width, _imageSize.height);
    CGAffineTransform viewbox = [RNSVGViewBox getTransform:imageBounds eRect:hitArea align:self.align meetOrSlice:self.meetOrSlice];

    CGContextTranslateCTM(context, 0, hitArea.size.height);
    CGContextScaleCTM(context, 1, -1);
    [self clip:context];
    CGContextClipToRect(context, hitArea);
    CGContextConcatCTM(context, viewbox);
    CGContextDrawImage(context, imageBounds, _image);
    CGContextRestoreGState(context);
}

- (CGRect)getHitArea
{
    CGFloat x = [self relativeOnWidth:self.x];
    CGFloat y = [self relativeOnHeight:self.y];
    CGFloat width = [self relativeOnWidth:self.width];
    CGFloat height = [self relativeOnHeight:self.height];
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

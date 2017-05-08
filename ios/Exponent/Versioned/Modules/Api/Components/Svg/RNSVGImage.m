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
    CGFloat _imageRatio;
}

- (void)setSrc:(id)src
{
    if (src == _src) {
        return;
    }
    _src = src;
    CGImageRelease(_image);
    RCTImageSource *source = [RCTConvert RCTImageSource:src];
    if (source.size.width != 0 && source.size.height != 0) {
        _imageRatio = source.size.width / source.size.height;
    } else {
        _imageRatio = 0.0;
    }
    
    _image = CGImageRetain([RCTConvert CGImage:src]);
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
    CGRect rect = [self getRect:context];
    // add hit area
    CGPathRef hitArea = CGPathCreateWithRect(rect, nil);
    [self setHitArea:hitArea];
    CGPathRelease(hitArea);
    
    CGContextSaveGState(context);
    CGContextTranslateCTM(context, 0, rect.size.height + 2 * rect.origin.y);
    CGContextScaleCTM(context, 1, -1);
    
    // apply viewBox transform on Image render.
    CGFloat imageRatio = _imageRatio;
    CGFloat rectWidth = CGRectGetWidth(rect);
    CGFloat rectHeight = CGRectGetHeight(rect);
    CGFloat rectX = CGRectGetMinX(rect);
    CGFloat rectY = CGRectGetMinY(rect);
    CGFloat rectRatio = rectWidth / rectHeight;
    CGRect renderRect;
    
    if (!imageRatio || imageRatio == rectRatio) {
        renderRect = rect;
    } else if (imageRatio < rectRatio) {
        renderRect = CGRectMake(0, 0, rectHeight * imageRatio, rectHeight);
    } else {
        renderRect = CGRectMake(0, 0, rectWidth, rectWidth / imageRatio);
    }
    
    CGRect vbRect = CGRectMake(0, 0, CGRectGetWidth(renderRect), CGRectGetHeight(renderRect));
    CGRect eRect = CGRectMake([self getContextLeft], [self getContextTop], rectWidth, rectHeight);
    
    CGAffineTransform transform = [RNSVGViewBox getTransform:vbRect eRect:eRect align:self.align meetOrSlice:self.meetOrSlice fromSymbol:NO];
    
    renderRect = CGRectApplyAffineTransform(renderRect, transform);
    renderRect = CGRectApplyAffineTransform(renderRect, CGAffineTransformMakeTranslation(rectX, rectY));
    
    [self clip:context];
    CGContextClipToRect(context, rect);
 
    CGContextDrawImage(context, renderRect, _image);
    CGContextRestoreGState(context);
    
}

- (CGRect)getRect:(CGContextRef)context
{
    return CGRectMake([self relativeOnWidth:self.x],
                      [self relativeOnHeight:self.y],
                      [self relativeOnWidth:self.width],
                      [self relativeOnHeight:self.height]);
}

- (CGPathRef)getPath:(CGContextRef)context
{
    return (CGPathRef)CFAutorelease(CGPathCreateWithRect([self getRect:context], nil));
}

@end

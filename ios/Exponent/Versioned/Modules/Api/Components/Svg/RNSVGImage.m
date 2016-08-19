/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGImage.h"
#import "RCTImageSource.h"
#import "RCTConvert+RNSVG.h"
#import "RCTLog.h"
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
    _imageRatio = source.size.width / source.size.height;
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
    self.hitArea = CFAutorelease(CGPathCreateWithRect(rect, nil));
    [self clip:context];
    
    CGContextSaveGState(context);
    CGContextTranslateCTM(context, 0, rect.size.height + 2 * rect.origin.y);
    CGContextScaleCTM(context, 1, -1);
    
    // apply viewBox transform on Image render.
    CGFloat imageRatio = _imageRatio;
    CGFloat rectWidth = rect.size.width;
    CGFloat rectHeight = rect.size.height;
    CGFloat rectX = rect.origin.x;
    CGFloat rectY = rect.origin.y;
    CGFloat rectRatio = rectWidth / rectHeight;
    CGRect renderRect;
    
    if (imageRatio == rectRatio) {
        renderRect = rect;
    } else if (imageRatio < rectRatio) {
        renderRect = CGRectMake(0, 0, rectHeight * imageRatio, rectHeight);
    } else {
        renderRect = CGRectMake(0, 0, rectWidth, rectWidth / imageRatio);
    }

    RNSVGViewBox *viewBox = [[RNSVGViewBox alloc] init];
    viewBox.minX = viewBox.minY = @"0";
    viewBox.vbWidth = [NSString stringWithFormat:@"%f", renderRect.size.width];
    viewBox.vbHeight = [NSString stringWithFormat:@"%f", renderRect.size.height];
    viewBox.width = [NSString stringWithFormat:@"%f", rectWidth];
    viewBox.height = [NSString stringWithFormat:@"%f", rectHeight];
    viewBox.align = self.align;
    viewBox.meetOrSlice = self.meetOrSlice;
    [viewBox setBoundingBox:CGRectMake(0, 0, rectWidth, rectHeight)];
    CGAffineTransform transform = [viewBox getTransform];
    
    renderRect = CGRectApplyAffineTransform(renderRect, transform);
    renderRect = CGRectApplyAffineTransform(renderRect, CGAffineTransformMakeTranslation(rectX, rectY));
    
    CGContextClipToRect(context, rect);
    CGContextDrawImage(context, renderRect, _image);
    CGContextRestoreGState(context);
    
}

- (CGRect)getRect:(CGContextRef)context
{
    [self setBoundingBox:CGContextGetClipBoundingBox(context)];
    CGFloat x = [self getWidthRelatedValue:self.x];
    CGFloat y = [self getHeightRelatedValue:self.y];
    CGFloat width = [self getWidthRelatedValue:self.width];
    CGFloat height = [self getHeightRelatedValue:self.height];
    return CGRectMake(x, y, width, height);
}

- (CGPathRef)getPath:(CGContextRef)context
{
    return CGPathCreateWithRect([self getRect:context], nil);
}

@end

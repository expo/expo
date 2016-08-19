/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGPath.h"

@implementation RNSVGPath

- (void)setD:(CGPathRef)d
{
    if (d == _d) {
        return;
    }
    
    [self invalidate];
    CGPathRelease(_d);
    _d = CGPathRetain(d);
}

- (void)dealloc
{
    CGPathRelease(_d);
}

- (void)renderLayerTo:(CGContextRef)context
{
    // todo: add detection if path has changed since last update.
    self.d = [self getPath:context];
    CGPathRef path = self.d;
    if ((!self.fill && !self.stroke) || !path) {
        return;
    }
    
    if ([self getSvgView].responsible) {
        // Add path to hitArea
        CGMutablePathRef hitArea = CGPathCreateMutableCopy(path);
        if (self.stroke) {
            // Add stroke to hitArea
            CGPathRef strokePath = CGPathCreateCopyByStrokingPath(hitArea, nil, self.strokeWidth, self.strokeLinecap, self.strokeLinejoin, self.strokeMiterlimit);
            CGPathAddPath(hitArea, nil, strokePath);
            CGPathRelease(strokePath);
        }
        
        CGAffineTransform transform = self.matrix;
        self.hitArea = CFAutorelease(CGPathCreateCopyByTransformingPath(hitArea, &transform));
        CGPathRelease(hitArea);
    }
    
    if (self.opacity == 0) {
        return;
    }
    
    CGPathDrawingMode mode = kCGPathStroke;
    BOOL fillColor = YES;
    
    if (self.fill) {
        mode = self.fillRule == kRNSVGCGFCRuleEvenodd ? kCGPathEOFill : kCGPathFill;
        fillColor = [self.fill applyFillColor:context opacity:self.fillOpacity];
        
        if (!fillColor) {
            [self clip:context];
            
            CGContextSaveGState(context);
            CGContextAddPath(context, path);
            CGContextClip(context);
            RNSVGBrushConverter *brushConverter = [[self getSvgView] getDefinedBrushConverter:[self.fill brushRef]];
            [self.fill paint:context opacity:self.fillOpacity brushConverter:brushConverter];
            CGContextRestoreGState(context);
            if (!self.stroke) {
                return;
            }
        }
    }
    
    if (self.stroke) {
        CGContextSetLineWidth(context, self.strokeWidth);
        CGContextSetLineCap(context, self.strokeLinecap);
        CGContextSetLineJoin(context, self.strokeLinejoin);
        RNSVGCGFloatArray dash = self.strokeDasharray;
        
        if (dash.count) {
            CGContextSetLineDash(context, self.strokeDashoffset, dash.array, dash.count);
        }
        
        if (!fillColor) {
            CGContextAddPath(context, path);
            CGContextReplacePathWithStrokedPath(context);
            CGContextClip(context);
        }
        
        if ([self.stroke applyStrokeColor:context opacity:self.strokeOpacity]) {
            if (mode == kCGPathFill) {
                mode = kCGPathFillStroke;
            } else if (mode == kCGPathEOFill) {
                mode = kCGPathEOFillStroke;
            }
        } else {
            // draw fill
            [self clip:context];
            CGContextAddPath(context, path);
            CGContextDrawPath(context, mode);
            
            // draw stroke
            CGContextAddPath(context, path);
            CGContextReplacePathWithStrokedPath(context);
            CGContextClip(context);
            RNSVGBrushConverter *brushConverter = [[self getSvgView] getDefinedBrushConverter:[self.stroke brushRef]];
            [self.stroke paint:context opacity:self.strokeOpacity brushConverter:brushConverter];
            return;
        }
    }
    
    [self clip:context];
    CGContextAddPath(context, path);
    CGContextDrawPath(context, mode);
}

- (CGPathRef)getPath:(CGContextRef)context
{
    return self.d;
}

@end

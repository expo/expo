/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGText.h"
#import "RNSVGBezierPath.h"
#import <CoreText/CoreText.h>

@implementation RNSVGText

static void RNSVGFreeTextFrame(RNSVGTextFrame frame)
{
    if (frame.count) {
        // We must release each line before freeing up this struct
        for (int i = 0; i < frame.count; i++) {
            CFRelease(frame.lines[i]);
        }
        free(frame.lines);
        free(frame.widths);
    }
}

- (void)setAlignment:(CTTextAlignment)alignment
{
    [self invalidate];
    _alignment = alignment;
}

- (void)setTextFrame:(RNSVGTextFrame)textFrame
{
    RNSVGFreeTextFrame(_textFrame);
    [self invalidate];
    _textFrame = textFrame;
}

- (void)setPath:(NSArray *)path
{
    if (path == _path) {
        return;
    }
    [self invalidate];
    _path = path;
}

- (void)dealloc
{
    RNSVGFreeTextFrame(_textFrame);
}

- (CGPathRef)getPath:(CGContextRef)context
{
    CGMutablePathRef path = CGPathCreateMutable();
    RNSVGTextFrame frame = self.textFrame;
    for (int i = 0; i < frame.count; i++) {
        CGFloat shift;
        CGFloat width = frame.widths[i];
        switch (self.alignment) {
            case kCTTextAlignmentRight:
                shift = width;
                break;
            case kCTTextAlignmentCenter:
                shift = width / 2;
                break;
            default:
                shift = 0;
                break;
        }
        // We should consider snapping this shift to device pixels to improve rendering quality
        // when a line has subpixel width.
        CGAffineTransform offset = CGAffineTransformMakeTranslation(-shift, frame.baseLine + frame.lineHeight * i + (self.path ? -frame.lineHeight : 0));
        
        CGMutablePathRef line = [self setLinePath:frame.lines[i]];
        CGPathAddPath(path, &offset, line);
        CGPathRelease(line);
    }
    
    return (CGPathRef)CFAutorelease(path);
}

- (CGMutablePathRef)setLinePath:(CTLineRef)line
{
    CGAffineTransform upsideDown = CGAffineTransformMakeScale(1.0, -1.0);
    CGMutablePathRef path = CGPathCreateMutable();
    
    CFArrayRef glyphRuns = CTLineGetGlyphRuns(line);
    CTRunRef run = CFArrayGetValueAtIndex(glyphRuns, 0);
    
    CFIndex runGlyphCount = CTRunGetGlyphCount(run);
    CGPoint positions[runGlyphCount];
    CGGlyph glyphs[runGlyphCount];
    
    // Grab the glyphs, positions, and font
    CTRunGetPositions(run, CFRangeMake(0, 0), positions);
    CTRunGetGlyphs(run, CFRangeMake(0, 0), glyphs);
    CFDictionaryRef attributes = CTRunGetAttributes(run);
    
    CTFontRef runFont = CFDictionaryGetValue(attributes, kCTFontAttributeName);
    
    RNSVGBezierPath *bezierPath = [[RNSVGBezierPath alloc] initWithBezierCurves:self.path];
    
    for(CFIndex i = 0; i < runGlyphCount; ++i) {
        CGPathRef letter = CTFontCreatePathForGlyph(runFont, glyphs[i], nil);
        CGPoint point = positions[i];
        
        if (letter) {
            CGAffineTransform transform;
            
            // draw glyphs along path
            if (self.path) {
                transform = [bezierPath transformAtDistance:point.x];
                
                // break loop if line reaches the end of the Path.
                if (!transform.a || !transform.d) {
                    CGPathRelease(letter);
                    break;
                }
                transform = CGAffineTransformScale(transform, 1.0, -1.0);
            } else {
                transform = CGAffineTransformTranslate(upsideDown, point.x, point.y);
            }
            
            
            CGPathAddPath(path, &transform, letter);
        }
        
        CGPathRelease(letter);
    }
    
    return path;
}

@end

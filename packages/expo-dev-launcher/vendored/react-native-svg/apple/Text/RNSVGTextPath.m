/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


#import "RNSVGTextPath.h"

@implementation RNSVGTextPath

- (void)setHref:(NSString *)href
{
    if ([href isEqualToString:_href]) {
        return;
    }
    [self invalidate];
    _href = href;
}

- (void)setSide:(NSString *)side
{
    if ([side isEqualToString:_side]) {
        return;
    }
    [self invalidate];
    _side = side;
}

- (void)setMethod:(NSString *)method
{
    if ([method isEqualToString:_method]) {
        return;
    }
    [self invalidate];
    _method = method;
}

- (void)setMidLine:(NSString *)midLine
{
    if ([midLine isEqualToString:_midLine]) {
        return;
    }
    [self invalidate];
    _midLine = midLine;
}

- (void)setSpacing:(NSString *)spacing
{
    if ([spacing isEqualToString:_spacing]) {
        return;
    }
    [self invalidate];
    _spacing = spacing;
}

- (void)setStartOffset:(RNSVGLength *)startOffset
{
    if ([startOffset isEqualTo:_startOffset]) {
        return;
    }
    [self invalidate];
    _startOffset = startOffset;
}

- (void)renderLayerTo:(CGContextRef)context rect:(CGRect)rect
{
    [self renderGroupTo:context rect:rect];
}

- (CGPathRef)getPath:(CGContextRef)context
{
    return [self getGroupPath:context];
}

- (void)pushGlyphContext
{
    // TextPath do not affect the glyphContext
}

- (void)popGlyphContext
{
    // TextPath do not affect the glyphContext
}

@end

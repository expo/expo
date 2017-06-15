/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


#import "ABI18_0_0RNSVGTextPath.h"
#import "ABI18_0_0RNSVGBezierTransformer.h"

@implementation ABI18_0_0RNSVGTextPath

- (void)renderLayerTo:(CGContextRef)context
{
    [self renderGroupTo:context];
}

- (ABI18_0_0RNSVGBezierTransformer *)getBezierTransformer
{
    ABI18_0_0RNSVGSvgView *svg = [self getSvgView];
    ABI18_0_0RNSVGNode *template = [svg getDefinedTemplate:self.href];

    if ([template class] != [ABI18_0_0RNSVGPath class]) {
        // warning about this.
        return nil;
    }

    ABI18_0_0RNSVGPath *path = (ABI18_0_0RNSVGPath *)template;
    CGFloat startOffset = [self relativeOnWidth:self.startOffset];
    return [[ABI18_0_0RNSVGBezierTransformer alloc] initWithBezierCurvesAndStartOffset:[path getBezierCurves]
                                                                  startOffset:startOffset];
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

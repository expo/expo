/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
#import "ABI43_0_0RNSVGUse.h"
#import "ABI43_0_0RNSVGSymbol.h"
#import <ABI43_0_0React/ABI43_0_0RCTLog.h>

@implementation ABI43_0_0RNSVGUse

- (void)setHref:(NSString *)href
{
    if ([href isEqualToString:_href]) {
        return;
    }

    [self invalidate];
    _href = href;
}

- (void)setX:(ABI43_0_0RNSVGLength *)x
{
    if ([x isEqualTo:_x]) {
        return;
    }

    [self invalidate];
    _x = x;
}

- (void)setY:(ABI43_0_0RNSVGLength *)y
{
    if ([y isEqualTo:_y]) {
        return;
    }

    [self invalidate];
    _y = y;
}


- (void)setUsewidth:(ABI43_0_0RNSVGLength *)usewidth
{
    if ([usewidth isEqualTo:_usewidth]) {
        return;
    }

    [self invalidate];
    _usewidth = usewidth;
}

- (void)setUseheight:(ABI43_0_0RNSVGLength *)useheight
{
    if ([useheight isEqualTo:_useheight]) {
        return;
    }

    [self invalidate];
    _useheight = useheight;
}

- (void)renderLayerTo:(CGContextRef)context rect:(CGRect)rect
{
    CGContextTranslateCTM(context, [self relativeOnWidth:self.x], [self relativeOnHeight:self.y]);
    ABI43_0_0RNSVGNode* template = [self.svgView getDefinedTemplate:self.href];
    if (template) {
        [self beginTransparencyLayer:context];
        [self clip:context];

        if ([template isKindOfClass:[ABI43_0_0RNSVGRenderable class]]) {
            [(ABI43_0_0RNSVGRenderable*)template mergeProperties:self];
        }

        if ([template class] == [ABI43_0_0RNSVGSymbol class]) {
            ABI43_0_0RNSVGSymbol *symbol = (ABI43_0_0RNSVGSymbol*)template;
            [symbol renderSymbolTo:context width:[self relativeOnWidth:self.usewidth] height:[self relativeOnHeight:self.useheight]];
        } else {
            [template renderTo:context rect:rect];
        }

        if ([template isKindOfClass:[ABI43_0_0RNSVGRenderable class]]) {
            [(ABI43_0_0RNSVGRenderable*)template resetProperties];
        }

        [self endTransparencyLayer:context];
    } else if (self.href) {
        // TODO: calling yellow box here
        ABI43_0_0RCTLogWarn(@"`Use` element expected a pre-defined svg template as `href` prop, template named: %@ is not defined.", self.href);
        return;
    } else {
        return;
    }
    CGRect bounds = template.clientRect;
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

- (ABI43_0_0RNSVGPlatformView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event {
    CGPoint transformed = CGPointApplyAffineTransform(point, self.invmatrix);
    transformed =  CGPointApplyAffineTransform(transformed, self.invTransform);
    ABI43_0_0RNSVGNode const* template = [self.svgView getDefinedTemplate:self.href];
    if (event) {
        self.active = NO;
    } else if (self.active) {
        return self;
    }
    ABI43_0_0RNSVGPlatformView const* hitChild = [template hitTest:transformed withEvent:event];
    if (hitChild) {
        self.active = YES;
        return self;
    }
    return nil;
}

- (CGPathRef)getPath: (CGContextRef)context
{
    CGAffineTransform transform = CGAffineTransformMakeTranslation([self relativeOnWidth:self.x], [self relativeOnHeight:self.y]);
    ABI43_0_0RNSVGNode const* template = [self.svgView getDefinedTemplate:self.href];
    if (!template) {
        return nil;
    }
    CGPathRef path = [template getPath:context];
    return CGPathCreateCopyByTransformingPath(path, &transform);
}

@end


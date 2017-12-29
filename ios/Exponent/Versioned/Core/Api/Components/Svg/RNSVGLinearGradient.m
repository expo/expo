/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
#import "RNSVGLinearGradient.h"
#import "RNSVGPainter.h"
#import "RNSVGBrushType.h"

@implementation RNSVGLinearGradient

- (void)setGradient:(NSArray<NSNumber *> *)gradient
{
    if (gradient == _gradient) {
        return;
    }
    
    _gradient = gradient;
    [self invalidate];
}

- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
    return nil;
}

- (void)parseReference
{
    NSArray<NSString *> *points = @[self.x1, self.y1, self.x2, self.y2];
    RNSVGPainter *painter = [[RNSVGPainter alloc] initWithPointsArray:points];
    [painter setUnits:self.gradientUnits];
    [painter setTransform:self.gradientTransform];
    [painter setLinearGradientColors:self.gradient];
    
    RNSVGSvgView *svg = [self getSvgView];
    if (self.gradientUnits == kRNSVGUnitsUserSpaceOnUse) {
        [painter setUserSpaceBoundingBox:[svg getContextBounds]];
    }
    
    [svg definePainter:painter painterName:self.name];
}
@end


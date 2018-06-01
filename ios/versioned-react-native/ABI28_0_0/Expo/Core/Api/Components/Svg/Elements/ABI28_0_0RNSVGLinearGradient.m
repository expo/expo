/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
#import "ABI28_0_0RNSVGLinearGradient.h"
#import "ABI28_0_0RNSVGPainter.h"
#import "ABI28_0_0RNSVGBrushType.h"

@implementation ABI28_0_0RNSVGLinearGradient

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
    ABI28_0_0RNSVGPainter *painter = [[ABI28_0_0RNSVGPainter alloc] initWithPointsArray:points];
    [painter setUnits:self.gradientUnits];
    [painter setTransform:self.gradientTransform];
    [painter setLinearGradientColors:self.gradient];
    
    ABI28_0_0RNSVGSvgView *svg = [self getSvgView];
    if (self.gradientUnits == kRNSVGUnitsUserSpaceOnUse) {
        [painter setUserSpaceBoundingBox:[svg getContextBounds]];
    }
    
    [svg definePainter:painter painterName:self.name];
}
@end


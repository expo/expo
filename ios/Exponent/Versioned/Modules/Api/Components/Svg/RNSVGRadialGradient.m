/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
#import "RNSVGRadialGradient.h"

@implementation RNSVGRadialGradient

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

- (void)saveDefinition
{
    RNSVGBrushConverter *converter = [[RNSVGBrushConverter alloc] init];
    converter.colors = self.gradient;
    converter.points = @[self.fx, self.fy, self.rx, self.ry, self.cx, self.cy];
    converter.type = kRNSVGRadialGradient;
    [[self getSvgView] defineBrushConverter:converter brushConverterRef:self.name];
}

@end


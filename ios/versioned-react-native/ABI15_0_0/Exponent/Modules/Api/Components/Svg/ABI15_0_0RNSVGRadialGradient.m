/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
#import "ABI15_0_0RNSVGRadialGradient.h"

@implementation ABI15_0_0RNSVGRadialGradient

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
    ABI15_0_0RNSVGBrushConverter *converter = [[ABI15_0_0RNSVGBrushConverter alloc] init];
    converter.colors = self.gradient;
    converter.points = @[self.fx, self.fy, self.rx, self.ry, self.cx, self.cy];
    converter.type = kABI15_0_0RNSVGRadialGradient;
    [[self getSvgView] defineBrushConverter:converter brushConverterRef:self.name];
}

@end


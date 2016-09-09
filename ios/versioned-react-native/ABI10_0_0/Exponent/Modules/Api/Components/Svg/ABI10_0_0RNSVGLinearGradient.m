/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
#import "ABI10_0_0RNSVGLinearGradient.h"
#import "ABI10_0_0RNSVGBrushConverter.h"
#import "ABI10_0_0RNSVGBrushType.h"

@implementation ABI10_0_0RNSVGLinearGradient

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
    ABI10_0_0RNSVGBrushConverter *converter = [[ABI10_0_0RNSVGBrushConverter alloc] init];
    converter.colors = self.gradient;
    converter.points = @[self.x1, self.y1, self.x2, self.y2];
    converter.type = kABI10_0_0RNSVGLinearGradient;
    [[self getSvgView] defineBrushConverter:converter brushConverterRef:self.name];
}
@end


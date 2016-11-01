/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
#import "ABI11_0_0RNSVGDefs.h"

@class ABI11_0_0RNSVGNode;

@implementation ABI11_0_0RNSVGDefs

- (void)renderTo:(CGContextRef)context
{
    for (ABI11_0_0RNSVGNode *node in self.subviews) {
        if ([node isKindOfClass:[ABI11_0_0RNSVGNode class]]) {
            [node saveDefinition];
        }
    }
}

- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
    return nil;
}

@end


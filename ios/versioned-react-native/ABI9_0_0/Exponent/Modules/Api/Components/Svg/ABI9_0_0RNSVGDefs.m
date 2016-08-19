/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
#import "ABI9_0_0RNSVGDefs.h"

@class ABI9_0_0RNSVGNode;

@implementation ABI9_0_0RNSVGDefs

- (void)renderTo:(CGContextRef)context
{
    for (ABI9_0_0RNSVGNode *node in self.subviews) {
        if ([node isKindOfClass:[ABI9_0_0RNSVGNode class]]) {
            [node saveDefinition];
        }
    }
}

- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
    return nil;
}

@end


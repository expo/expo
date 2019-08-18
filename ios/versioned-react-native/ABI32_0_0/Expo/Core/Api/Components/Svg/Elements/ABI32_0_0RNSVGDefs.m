/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
#import "ABI32_0_0RNSVGDefs.h"

@class ABI32_0_0RNSVGNode;

@implementation ABI32_0_0RNSVGDefs

- (void)renderTo:(CGContextRef)context
{
    // Defs do not render
}

- (void)parseReference
{
    [self traverseSubviews:^(ABI32_0_0RNSVGNode *node) {
        if ([node isKindOfClass:[ABI32_0_0RNSVGNode class]]) {
            [node parseReference];
        }
        return YES;
    }];
}

- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
    return nil;
}

@end


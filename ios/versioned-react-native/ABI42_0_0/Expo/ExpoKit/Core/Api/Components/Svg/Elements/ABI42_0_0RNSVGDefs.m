/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
#import "ABI42_0_0RNSVGDefs.h"

@class ABI42_0_0RNSVGNode;

@implementation ABI42_0_0RNSVGDefs

- (void)renderTo:(CGContextRef)context
{
    // Defs do not render
}

- (void)parseReference
{
    self.dirty = false;
    [self traverseSubviews:^(ABI42_0_0RNSVGNode *node) {
        if ([node isKindOfClass:[ABI42_0_0RNSVGNode class]]) {
            [node parseReference];
        }
        return YES;
    }];
}

- (ABI42_0_0RNSVGPlatformView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
    return nil;
}

@end


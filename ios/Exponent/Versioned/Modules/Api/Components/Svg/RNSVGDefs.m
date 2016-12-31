/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
#import "RNSVGDefs.h"

@class RNSVGNode;

@implementation RNSVGDefs

- (void)renderTo:(CGContextRef)context
{
    [self traverseSubviews:^(RNSVGNode *node) {
        [node saveDefinition];
        return YES;
    }];
}

- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
    return nil;
}

@end


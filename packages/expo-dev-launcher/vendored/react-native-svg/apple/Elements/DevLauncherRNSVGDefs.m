/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
#import "DevLauncherRNSVGDefs.h"

@class DevLauncherRNSVGNode;

@implementation DevLauncherRNSVGDefs

- (void)renderTo:(CGContextRef)context
{
    // Defs do not render
}

- (void)parseReference
{
    self.dirty = false;
    [self traverseSubviews:^(DevLauncherRNSVGNode *node) {
        if ([node isKindOfClass:[DevLauncherRNSVGNode class]]) {
            [node parseReference];
        }
        return YES;
    }];
}

- (DevLauncherRNSVGPlatformView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
    return nil;
}

@end


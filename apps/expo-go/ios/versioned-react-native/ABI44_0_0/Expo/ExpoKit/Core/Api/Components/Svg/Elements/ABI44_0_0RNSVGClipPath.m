/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI44_0_0RNSVGClipPath.h"

@implementation ABI44_0_0RNSVGClipPath

- (void)parseReference
{
    self.dirty = false;
    [self.svgView defineClipPath:self clipPathName:self.name];
}


- (BOOL)isSimpleClipPath
{
    NSArray<ABI44_0_0RNSVGView*> *children = self.subviews;
    if (children.count == 1) {
        ABI44_0_0RNSVGView* child = children[0];
        if ([child class] != [ABI44_0_0RNSVGGroup class]) {
            return true;
        }
    }
    return false;
}

@end

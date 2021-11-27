/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "DevLauncherRNSVGClipPath.h"

@implementation DevLauncherRNSVGClipPath

- (void)parseReference
{
    self.dirty = false;
    [self.svgView defineClipPath:self clipPathName:self.name];
}


- (BOOL)isSimpleClipPath
{
    NSArray<DevLauncherRNSVGView*> *children = self.subviews;
    if (children.count == 1) {
        DevLauncherRNSVGView* child = children[0];
        if ([child class] != [DevLauncherRNSVGGroup class]) {
            return true;
        }
    }
    return false;
}

@end

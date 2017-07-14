/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI19_0_0RNSVGNodeManager.h"

#import "ABI19_0_0RNSVGNode.h"

@implementation ABI19_0_0RNSVGNodeManager

ABI19_0_0RCT_EXPORT_MODULE()

- (ABI19_0_0RNSVGNode *)node
{
    return [ABI19_0_0RNSVGNode new];
}

- (UIView *)view
{
    return [self node];
}

- (ABI19_0_0RCTShadowView *)shadowView
{
    return nil;
}

ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(name, NSString)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, CGFloat)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(matrix, CGAffineTransform)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(clipPath, NSString)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(clipRule, ABI19_0_0RNSVGCGFCRule)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(responsible, BOOL)

@end

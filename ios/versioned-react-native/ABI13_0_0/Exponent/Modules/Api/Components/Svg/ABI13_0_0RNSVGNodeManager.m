/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI13_0_0RNSVGNodeManager.h"

#import "ABI13_0_0RNSVGNode.h"

@implementation ABI13_0_0RNSVGNodeManager

ABI13_0_0RCT_EXPORT_MODULE()

- (ABI13_0_0RNSVGNode *)node
{
    return [ABI13_0_0RNSVGNode new];
}

- (UIView *)view
{
    return [self node];
}

- (ABI13_0_0RCTShadowView *)shadowView
{
    return nil;
}

ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(name, NSString)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, CGFloat)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(matrix, CGAffineTransform)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(clipPathRef, NSString)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(clipPath, CGPath)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(clipRule, ABI13_0_0RNSVGCGFCRule)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(responsible, BOOL)

@end

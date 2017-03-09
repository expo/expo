/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI15_0_0RNSVGNodeManager.h"

#import "ABI15_0_0RNSVGNode.h"

@implementation ABI15_0_0RNSVGNodeManager

ABI15_0_0RCT_EXPORT_MODULE()

- (ABI15_0_0RNSVGNode *)node
{
    return [ABI15_0_0RNSVGNode new];
}

- (UIView *)view
{
    return [self node];
}

- (ABI15_0_0RCTShadowView *)shadowView
{
    return nil;
}

ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(name, NSString)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, CGFloat)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(matrix, CGAffineTransform)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(clipPathRef, NSString)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(clipPath, CGPath)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(clipRule, ABI15_0_0RNSVGCGFCRule)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(responsible, BOOL)

@end

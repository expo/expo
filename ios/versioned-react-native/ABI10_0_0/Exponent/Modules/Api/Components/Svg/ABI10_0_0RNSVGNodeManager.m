/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI10_0_0RNSVGNodeManager.h"

#import "ABI10_0_0RNSVGNode.h"

@implementation ABI10_0_0RNSVGNodeManager

ABI10_0_0RCT_EXPORT_MODULE()

- (ABI10_0_0RNSVGNode *)node
{
    return [ABI10_0_0RNSVGNode new];
}

- (UIView *)view
{
    return [self node];
}

- (ABI10_0_0RCTShadowView *)shadowView
{
    return nil;
}

ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(name, NSString)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, CGFloat)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(matrix, CGAffineTransform)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(clipPathRef, NSString)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(clipPath, CGPath)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(clipRule, ABI10_0_0RNSVGCGFCRule)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(responsible, BOOL)

@end

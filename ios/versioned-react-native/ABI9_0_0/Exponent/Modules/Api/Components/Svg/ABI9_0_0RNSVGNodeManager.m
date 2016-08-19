/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI9_0_0RNSVGNodeManager.h"

#import "ABI9_0_0RNSVGNode.h"

@implementation ABI9_0_0RNSVGNodeManager

ABI9_0_0RCT_EXPORT_MODULE()

- (ABI9_0_0RNSVGNode *)node
{
    return [ABI9_0_0RNSVGNode new];
}

- (UIView *)view
{
    return [self node];
}

- (ABI9_0_0RCTShadowView *)shadowView
{
    return nil;
}

ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(name, NSString)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, CGFloat)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(matrix, CGAffineTransform)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(clipPathRef, NSString)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(clipPath, CGPath)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(clipRule, ABI9_0_0RNSVGCGFCRule)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(responsible, BOOL)

@end

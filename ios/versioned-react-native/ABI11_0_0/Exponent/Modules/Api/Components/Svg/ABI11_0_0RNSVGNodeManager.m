/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI11_0_0RNSVGNodeManager.h"

#import "ABI11_0_0RNSVGNode.h"

@implementation ABI11_0_0RNSVGNodeManager

ABI11_0_0RCT_EXPORT_MODULE()

- (ABI11_0_0RNSVGNode *)node
{
    return [ABI11_0_0RNSVGNode new];
}

- (UIView *)view
{
    return [self node];
}

- (ABI11_0_0RCTShadowView *)shadowView
{
    return nil;
}

ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(name, NSString)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, CGFloat)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(matrix, CGAffineTransform)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(clipPathRef, NSString)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(clipPath, CGPath)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(clipRule, ABI11_0_0RNSVGCGFCRule)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(responsible, BOOL)

@end

/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI12_0_0RNSVGNodeManager.h"

#import "ABI12_0_0RNSVGNode.h"

@implementation ABI12_0_0RNSVGNodeManager

ABI12_0_0RCT_EXPORT_MODULE()

- (ABI12_0_0RNSVGNode *)node
{
    return [ABI12_0_0RNSVGNode new];
}

- (UIView *)view
{
    return [self node];
}

- (ABI12_0_0RCTShadowView *)shadowView
{
    return nil;
}

ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(name, NSString)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, CGFloat)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(matrix, CGAffineTransform)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(clipPathRef, NSString)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(clipPath, CGPath)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(clipRule, ABI12_0_0RNSVGCGFCRule)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(responsible, BOOL)

@end

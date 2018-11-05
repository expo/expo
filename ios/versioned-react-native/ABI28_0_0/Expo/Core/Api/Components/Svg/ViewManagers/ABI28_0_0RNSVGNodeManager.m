/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI28_0_0RNSVGNodeManager.h"

#import "ABI28_0_0RNSVGNode.h"

@implementation ABI28_0_0RNSVGNodeManager

ABI28_0_0RCT_EXPORT_MODULE()

- (ABI28_0_0RNSVGNode *)node
{
    return [ABI28_0_0RNSVGNode new];
}

- (UIView *)view
{
    return [self node];
}

- (ABI28_0_0RCTShadowView *)shadowView
{
    return nil;
}

ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(name, NSString)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, CGFloat)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(matrix, CGAffineTransform)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(clipPath, NSString)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(clipRule, ABI28_0_0RNSVGCGFCRule)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(responsible, BOOL)

@end

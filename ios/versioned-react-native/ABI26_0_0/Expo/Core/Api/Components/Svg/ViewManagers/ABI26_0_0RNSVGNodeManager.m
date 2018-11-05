/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI26_0_0RNSVGNodeManager.h"

#import "ABI26_0_0RNSVGNode.h"

@implementation ABI26_0_0RNSVGNodeManager

ABI26_0_0RCT_EXPORT_MODULE()

- (ABI26_0_0RNSVGNode *)node
{
    return [ABI26_0_0RNSVGNode new];
}

- (UIView *)view
{
    return [self node];
}

- (ABI26_0_0RCTShadowView *)shadowView
{
    return nil;
}

ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(name, NSString)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, CGFloat)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(matrix, CGAffineTransform)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(clipPath, NSString)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(clipRule, ABI26_0_0RNSVGCGFCRule)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(responsible, BOOL)

@end

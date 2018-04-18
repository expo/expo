/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI27_0_0RNSVGNodeManager.h"

#import "ABI27_0_0RNSVGNode.h"

@implementation ABI27_0_0RNSVGNodeManager

ABI27_0_0RCT_EXPORT_MODULE()

- (ABI27_0_0RNSVGNode *)node
{
    return [ABI27_0_0RNSVGNode new];
}

- (UIView *)view
{
    return [self node];
}

- (ABI27_0_0RCTShadowView *)shadowView
{
    return nil;
}

ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(name, NSString)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, CGFloat)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(matrix, CGAffineTransform)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(clipPath, NSString)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(clipRule, ABI27_0_0RNSVGCGFCRule)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(responsible, BOOL)

@end

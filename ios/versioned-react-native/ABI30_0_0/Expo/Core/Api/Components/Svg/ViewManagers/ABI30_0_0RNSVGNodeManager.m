/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI30_0_0RNSVGNodeManager.h"

#import "ABI30_0_0RNSVGNode.h"

@implementation ABI30_0_0RNSVGNodeManager

ABI30_0_0RCT_EXPORT_MODULE()

- (ABI30_0_0RNSVGNode *)node
{
    return [ABI30_0_0RNSVGNode new];
}

- (UIView *)view
{
    return [self node];
}

- (ABI30_0_0RCTShadowView *)shadowView
{
    return nil;
}

ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(name, NSString)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, CGFloat)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(matrix, CGAffineTransform)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(clipPath, NSString)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(clipRule, ABI30_0_0RNSVGCGFCRule)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(responsible, BOOL)

@end

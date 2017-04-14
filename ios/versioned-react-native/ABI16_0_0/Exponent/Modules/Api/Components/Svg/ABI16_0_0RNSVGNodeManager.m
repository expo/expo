/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI16_0_0RNSVGNodeManager.h"

#import "ABI16_0_0RNSVGNode.h"

@implementation ABI16_0_0RNSVGNodeManager

ABI16_0_0RCT_EXPORT_MODULE()

- (ABI16_0_0RNSVGNode *)node
{
    return [ABI16_0_0RNSVGNode new];
}

- (UIView *)view
{
    return [self node];
}

- (ABI16_0_0RCTShadowView *)shadowView
{
    return nil;
}

ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(name, NSString)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, CGFloat)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(matrix, CGAffineTransform)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(clipPathRef, NSString)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(clipPath, CGPath)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(clipRule, ABI16_0_0RNSVGCGFCRule)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(responsible, BOOL)

@end

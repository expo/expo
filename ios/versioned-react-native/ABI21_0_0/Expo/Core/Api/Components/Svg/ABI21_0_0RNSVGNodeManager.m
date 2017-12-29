/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI21_0_0RNSVGNodeManager.h"

#import "ABI21_0_0RNSVGNode.h"

@implementation ABI21_0_0RNSVGNodeManager

ABI21_0_0RCT_EXPORT_MODULE()

- (ABI21_0_0RNSVGNode *)node
{
    return [ABI21_0_0RNSVGNode new];
}

- (UIView *)view
{
    return [self node];
}

- (ABI21_0_0RCTShadowView *)shadowView
{
    return nil;
}

ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(name, NSString)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, CGFloat)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(matrix, CGAffineTransform)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(clipPath, NSString)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(clipRule, ABI21_0_0RNSVGCGFCRule)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(responsible, BOOL)

@end

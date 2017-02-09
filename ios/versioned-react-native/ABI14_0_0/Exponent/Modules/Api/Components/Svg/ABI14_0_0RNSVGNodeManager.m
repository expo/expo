/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI14_0_0RNSVGNodeManager.h"

#import "ABI14_0_0RNSVGNode.h"

@implementation ABI14_0_0RNSVGNodeManager

ABI14_0_0RCT_EXPORT_MODULE()

- (ABI14_0_0RNSVGNode *)node
{
    return [ABI14_0_0RNSVGNode new];
}

- (UIView *)view
{
    return [self node];
}

- (ABI14_0_0RCTShadowView *)shadowView
{
    return nil;
}

ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(name, NSString)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, CGFloat)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(matrix, CGAffineTransform)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(clipPathRef, NSString)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(clipPath, CGPath)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(clipRule, ABI14_0_0RNSVGCGFCRule)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(responsible, BOOL)

@end

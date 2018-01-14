/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI25_0_0RNSVGNodeManager.h"

#import "ABI25_0_0RNSVGNode.h"

@implementation ABI25_0_0RNSVGNodeManager

ABI25_0_0RCT_EXPORT_MODULE()

- (ABI25_0_0RNSVGNode *)node
{
    return [ABI25_0_0RNSVGNode new];
}

- (UIView *)view
{
    return [self node];
}

- (ABI25_0_0RCTShadowView *)shadowView
{
    return nil;
}

ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(name, NSString)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, CGFloat)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(matrix, CGAffineTransform)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(clipPath, NSString)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(clipRule, ABI25_0_0RNSVGCGFCRule)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(responsible, BOOL)

@end

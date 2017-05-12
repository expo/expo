/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI17_0_0RNSVGNodeManager.h"

#import "ABI17_0_0RNSVGNode.h"

@implementation ABI17_0_0RNSVGNodeManager

ABI17_0_0RCT_EXPORT_MODULE()

- (ABI17_0_0RNSVGNode *)node
{
    return [ABI17_0_0RNSVGNode new];
}

- (UIView *)view
{
    return [self node];
}

- (ABI17_0_0RCTShadowView *)shadowView
{
    return nil;
}

ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(name, NSString)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, CGFloat)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(matrix, CGAffineTransform)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(clipPath, NSString)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(clipRule, ABI17_0_0RNSVGCGFCRule)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(responsible, BOOL)

@end

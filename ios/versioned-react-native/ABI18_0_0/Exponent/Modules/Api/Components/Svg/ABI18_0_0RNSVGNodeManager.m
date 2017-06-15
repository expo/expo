/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI18_0_0RNSVGNodeManager.h"

#import "ABI18_0_0RNSVGNode.h"

@implementation ABI18_0_0RNSVGNodeManager

ABI18_0_0RCT_EXPORT_MODULE()

- (ABI18_0_0RNSVGNode *)node
{
    return [ABI18_0_0RNSVGNode new];
}

- (UIView *)view
{
    return [self node];
}

- (ABI18_0_0RCTShadowView *)shadowView
{
    return nil;
}

ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(name, NSString)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, CGFloat)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(matrix, CGAffineTransform)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(clipPath, NSString)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(clipRule, ABI18_0_0RNSVGCGFCRule)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(responsible, BOOL)

@end

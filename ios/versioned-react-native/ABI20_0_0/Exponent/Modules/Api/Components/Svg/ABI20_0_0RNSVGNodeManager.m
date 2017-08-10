/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI20_0_0RNSVGNodeManager.h"

#import "ABI20_0_0RNSVGNode.h"

@implementation ABI20_0_0RNSVGNodeManager

ABI20_0_0RCT_EXPORT_MODULE()

- (ABI20_0_0RNSVGNode *)node
{
    return [ABI20_0_0RNSVGNode new];
}

- (UIView *)view
{
    return [self node];
}

- (ABI20_0_0RCTShadowView *)shadowView
{
    return nil;
}

ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(name, NSString)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, CGFloat)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(matrix, CGAffineTransform)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(clipPath, NSString)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(clipRule, ABI20_0_0RNSVGCGFCRule)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(responsible, BOOL)

@end

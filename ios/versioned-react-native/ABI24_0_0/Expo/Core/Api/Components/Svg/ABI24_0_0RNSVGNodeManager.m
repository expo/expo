/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI24_0_0RNSVGNodeManager.h"

#import "ABI24_0_0RNSVGNode.h"

@implementation ABI24_0_0RNSVGNodeManager

ABI24_0_0RCT_EXPORT_MODULE()

- (ABI24_0_0RNSVGNode *)node
{
    return [ABI24_0_0RNSVGNode new];
}

- (UIView *)view
{
    return [self node];
}

- (ABI24_0_0RCTShadowView *)shadowView
{
    return nil;
}

ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(name, NSString)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, CGFloat)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(matrix, CGAffineTransform)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(clipPath, NSString)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(clipRule, ABI24_0_0RNSVGCGFCRule)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(responsible, BOOL)

@end

/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI22_0_0RNSVGNodeManager.h"

#import "ABI22_0_0RNSVGNode.h"

@implementation ABI22_0_0RNSVGNodeManager

ABI22_0_0RCT_EXPORT_MODULE()

- (ABI22_0_0RNSVGNode *)node
{
    return [ABI22_0_0RNSVGNode new];
}

- (UIView *)view
{
    return [self node];
}

- (ABI22_0_0RCTShadowView *)shadowView
{
    return nil;
}

ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(name, NSString)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, CGFloat)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(matrix, CGAffineTransform)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(clipPath, NSString)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(clipRule, ABI22_0_0RNSVGCGFCRule)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(responsible, BOOL)

@end

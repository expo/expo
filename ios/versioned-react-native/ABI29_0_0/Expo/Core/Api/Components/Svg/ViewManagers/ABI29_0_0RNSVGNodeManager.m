/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI29_0_0RNSVGNodeManager.h"

#import "ABI29_0_0RNSVGNode.h"

@implementation ABI29_0_0RNSVGNodeManager

ABI29_0_0RCT_EXPORT_MODULE()

- (ABI29_0_0RNSVGNode *)node
{
    return [ABI29_0_0RNSVGNode new];
}

- (UIView *)view
{
    return [self node];
}

- (ABI29_0_0RCTShadowView *)shadowView
{
    return nil;
}

ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(name, NSString)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, CGFloat)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(matrix, CGAffineTransform)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(clipPath, NSString)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(clipRule, ABI29_0_0RNSVGCGFCRule)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(responsible, BOOL)

@end

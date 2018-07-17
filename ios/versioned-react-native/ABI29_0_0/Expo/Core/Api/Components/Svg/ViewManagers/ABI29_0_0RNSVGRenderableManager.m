/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI29_0_0RNSVGRenderableManager.h"

#import "ABI29_0_0RCTConvert+RNSVG.h"
#import "ABI29_0_0RNSVGCGFCRule.h"

@implementation ABI29_0_0RNSVGRenderableManager

ABI29_0_0RCT_EXPORT_MODULE()

- (ABI29_0_0RNSVGRenderable *)node
{
    return [ABI29_0_0RNSVGRenderable new];
}

ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(fill, ABI29_0_0RNSVGBrush)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(fillOpacity, CGFloat)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(fillRule, ABI29_0_0RNSVGCGFCRule)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(stroke, ABI29_0_0RNSVGBrush)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(strokeOpacity, CGFloat)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, NSString)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinecap, CGLineCap)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinejoin, CGLineJoin)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDasharray, NSArray<NSString *>)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDashoffset, CGFloat)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(strokeMiterlimit, CGFloat)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(propList, NSArray<NSString *>)

@end

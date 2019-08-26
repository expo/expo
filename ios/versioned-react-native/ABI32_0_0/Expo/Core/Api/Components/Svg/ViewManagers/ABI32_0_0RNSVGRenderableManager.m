/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI32_0_0RNSVGRenderableManager.h"

#import "ABI32_0_0RCTConvert+RNSVG.h"
#import "ABI32_0_0RNSVGCGFCRule.h"

@implementation ABI32_0_0RNSVGRenderableManager

ABI32_0_0RCT_EXPORT_MODULE()

- (ABI32_0_0RNSVGRenderable *)node
{
    return [ABI32_0_0RNSVGRenderable new];
}

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(fill, ABI32_0_0RNSVGBrush)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(fillOpacity, CGFloat)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(fillRule, ABI32_0_0RNSVGCGFCRule)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(stroke, ABI32_0_0RNSVGBrush)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(strokeOpacity, CGFloat)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, ABI32_0_0RNSVGLength*)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinecap, CGLineCap)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinejoin, CGLineJoin)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDasharray, NSArray<ABI32_0_0RNSVGLength *>)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDashoffset, CGFloat)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(strokeMiterlimit, CGFloat)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(propList, NSArray<NSString *>)

@end

/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0RNSVGRenderableManager.h"

#import "ABI31_0_0RCTConvert+RNSVG.h"
#import "ABI31_0_0RNSVGCGFCRule.h"

@implementation ABI31_0_0RNSVGRenderableManager

ABI31_0_0RCT_EXPORT_MODULE()

- (ABI31_0_0RNSVGRenderable *)node
{
    return [ABI31_0_0RNSVGRenderable new];
}

ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(fill, ABI31_0_0RNSVGBrush)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(fillOpacity, CGFloat)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(fillRule, ABI31_0_0RNSVGCGFCRule)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(stroke, ABI31_0_0RNSVGBrush)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(strokeOpacity, CGFloat)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, ABI31_0_0RNSVGLength*)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinecap, CGLineCap)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinejoin, CGLineJoin)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDasharray, NSArray<ABI31_0_0RNSVGLength *>)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDashoffset, CGFloat)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(strokeMiterlimit, CGFloat)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(propList, NSArray<NSString *>)

@end

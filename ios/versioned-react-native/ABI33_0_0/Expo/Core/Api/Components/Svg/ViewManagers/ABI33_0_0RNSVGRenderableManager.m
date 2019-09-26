/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI33_0_0RNSVGRenderableManager.h"

#import "ABI33_0_0RCTConvert+RNSVG.h"
#import "ABI33_0_0RNSVGCGFCRule.h"

@implementation ABI33_0_0RNSVGRenderableManager

ABI33_0_0RCT_EXPORT_MODULE()

- (ABI33_0_0RNSVGRenderable *)node
{
    return [ABI33_0_0RNSVGRenderable new];
}

ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(fill, ABI33_0_0RNSVGBrush)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(fillOpacity, CGFloat)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(fillRule, ABI33_0_0RNSVGCGFCRule)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(stroke, ABI33_0_0RNSVGBrush)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(strokeOpacity, CGFloat)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, ABI33_0_0RNSVGLength*)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinecap, CGLineCap)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinejoin, CGLineJoin)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDasharray, NSArray<ABI33_0_0RNSVGLength *>)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDashoffset, CGFloat)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(strokeMiterlimit, CGFloat)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(vectorEffect, int)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(propList, NSArray<NSString *>)

@end

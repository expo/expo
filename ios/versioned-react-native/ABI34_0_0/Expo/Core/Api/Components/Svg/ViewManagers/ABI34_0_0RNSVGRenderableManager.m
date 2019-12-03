/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI34_0_0RNSVGRenderableManager.h"

#import "ABI34_0_0RCTConvert+RNSVG.h"
#import "ABI34_0_0RNSVGCGFCRule.h"

@implementation ABI34_0_0RNSVGRenderableManager

ABI34_0_0RCT_EXPORT_MODULE()

- (ABI34_0_0RNSVGRenderable *)node
{
    return [ABI34_0_0RNSVGRenderable new];
}

ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(fill, ABI34_0_0RNSVGBrush)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(fillOpacity, CGFloat)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(fillRule, ABI34_0_0RNSVGCGFCRule)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(stroke, ABI34_0_0RNSVGBrush)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(strokeOpacity, CGFloat)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, ABI34_0_0RNSVGLength*)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinecap, CGLineCap)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinejoin, CGLineJoin)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDasharray, NSArray<ABI34_0_0RNSVGLength *>)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDashoffset, CGFloat)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(strokeMiterlimit, CGFloat)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(vectorEffect, int)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(propList, NSArray<NSString *>)

@end

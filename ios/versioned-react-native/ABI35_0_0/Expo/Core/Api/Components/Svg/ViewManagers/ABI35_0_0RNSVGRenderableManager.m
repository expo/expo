/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI35_0_0RNSVGRenderableManager.h"

#import "ABI35_0_0RCTConvert+RNSVG.h"
#import "ABI35_0_0RNSVGCGFCRule.h"

@implementation ABI35_0_0RNSVGRenderableManager

ABI35_0_0RCT_EXPORT_MODULE()

- (ABI35_0_0RNSVGRenderable *)node
{
    return [ABI35_0_0RNSVGRenderable new];
}

ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(fill, ABI35_0_0RNSVGBrush)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(fillOpacity, CGFloat)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(fillRule, ABI35_0_0RNSVGCGFCRule)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(stroke, ABI35_0_0RNSVGBrush)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(strokeOpacity, CGFloat)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, ABI35_0_0RNSVGLength*)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinecap, CGLineCap)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinejoin, CGLineJoin)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDasharray, NSArray<ABI35_0_0RNSVGLength *>)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDashoffset, CGFloat)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(strokeMiterlimit, CGFloat)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(vectorEffect, int)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(propList, NSArray<NSString *>)

@end

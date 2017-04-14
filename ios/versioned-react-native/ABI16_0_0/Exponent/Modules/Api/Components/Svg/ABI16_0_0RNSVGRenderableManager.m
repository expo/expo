/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI16_0_0RNSVGRenderableManager.h"

#import "ABI16_0_0RCTConvert+RNSVG.h"
#import "ABI16_0_0RNSVGCGFCRule.h"

@implementation ABI16_0_0RNSVGRenderableManager

ABI16_0_0RCT_EXPORT_MODULE()

- (ABI16_0_0RNSVGRenderable *)node
{
    return [ABI16_0_0RNSVGRenderable new];
}

ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(fill, ABI16_0_0RNSVGBrush)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(fillOpacity, CGFloat)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(fillRule, ABI16_0_0RNSVGCGFCRule)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(stroke, ABI16_0_0RNSVGBrush)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(strokeOpacity, CGFloat)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinecap, CGLineCap)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinejoin, CGLineJoin)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDasharray, ABI16_0_0RNSVGCGFloatArray)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDashoffset, CGFloat)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(strokeMiterlimit, CGFloat)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(propList, NSArray<NSString *>)

@end

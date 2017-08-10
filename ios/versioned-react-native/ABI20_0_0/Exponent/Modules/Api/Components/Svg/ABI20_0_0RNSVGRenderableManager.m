/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI20_0_0RNSVGRenderableManager.h"

#import "ABI20_0_0RCTConvert+RNSVG.h"
#import "ABI20_0_0RNSVGCGFCRule.h"

@implementation ABI20_0_0RNSVGRenderableManager

ABI20_0_0RCT_EXPORT_MODULE()

- (ABI20_0_0RNSVGRenderable *)node
{
    return [ABI20_0_0RNSVGRenderable new];
}

ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(fill, ABI20_0_0RNSVGBrush)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(fillOpacity, CGFloat)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(fillRule, ABI20_0_0RNSVGCGFCRule)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(stroke, ABI20_0_0RNSVGBrush)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(strokeOpacity, CGFloat)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinecap, CGLineCap)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinejoin, CGLineJoin)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDasharray, ABI20_0_0RNSVGCGFloatArray)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDashoffset, CGFloat)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(strokeMiterlimit, CGFloat)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(propList, NSArray<NSString *>)

@end

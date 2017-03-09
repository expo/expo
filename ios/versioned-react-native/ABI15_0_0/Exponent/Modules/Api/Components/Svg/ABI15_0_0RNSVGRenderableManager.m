/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI15_0_0RNSVGRenderableManager.h"

#import "ABI15_0_0RCTConvert+RNSVG.h"
#import "ABI15_0_0RNSVGCGFCRule.h"

@implementation ABI15_0_0RNSVGRenderableManager

ABI15_0_0RCT_EXPORT_MODULE()

- (ABI15_0_0RNSVGRenderable *)node
{
    return [ABI15_0_0RNSVGRenderable new];
}

ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(fill, ABI15_0_0RNSVGBrush)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(fillOpacity, CGFloat)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(fillRule, ABI15_0_0RNSVGCGFCRule)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(stroke, ABI15_0_0RNSVGBrush)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(strokeOpacity, CGFloat)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinecap, CGLineCap)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinejoin, CGLineJoin)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDasharray, ABI15_0_0RNSVGCGFloatArray)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDashoffset, CGFloat)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(strokeMiterlimit, CGFloat)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(propList, NSArray<NSString *>)

@end

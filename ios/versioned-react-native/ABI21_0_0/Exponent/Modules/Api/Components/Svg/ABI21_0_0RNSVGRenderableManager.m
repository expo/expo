/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI21_0_0RNSVGRenderableManager.h"

#import "ABI21_0_0RCTConvert+RNSVG.h"
#import "ABI21_0_0RNSVGCGFCRule.h"

@implementation ABI21_0_0RNSVGRenderableManager

ABI21_0_0RCT_EXPORT_MODULE()

- (ABI21_0_0RNSVGRenderable *)node
{
    return [ABI21_0_0RNSVGRenderable new];
}

ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(fill, ABI21_0_0RNSVGBrush)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(fillOpacity, CGFloat)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(fillRule, ABI21_0_0RNSVGCGFCRule)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(stroke, ABI21_0_0RNSVGBrush)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(strokeOpacity, CGFloat)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinecap, CGLineCap)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinejoin, CGLineJoin)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDasharray, ABI21_0_0RNSVGCGFloatArray)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDashoffset, CGFloat)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(strokeMiterlimit, CGFloat)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(propList, NSArray<NSString *>)

@end

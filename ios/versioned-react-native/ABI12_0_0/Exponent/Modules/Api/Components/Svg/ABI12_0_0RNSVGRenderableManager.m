/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI12_0_0RNSVGRenderableManager.h"

#import "ABI12_0_0RCTConvert+RNSVG.h"
#import "ABI12_0_0RNSVGCGFCRule.h"

@implementation ABI12_0_0RNSVGRenderableManager

ABI12_0_0RCT_EXPORT_MODULE()

- (ABI12_0_0RNSVGRenderable *)node
{
    return [ABI12_0_0RNSVGRenderable new];
}

ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(fill, ABI12_0_0RNSVGBrush)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(fillOpacity, CGFloat)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(fillRule, ABI12_0_0RNSVGCGFCRule)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(stroke, ABI12_0_0RNSVGBrush)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(strokeOpacity, CGFloat)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinecap, CGLineCap)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinejoin, CGLineJoin)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDasharray, ABI12_0_0RNSVGCGFloatArray)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDashoffset, CGFloat)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(strokeMiterlimit, CGFloat)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(propList, NSArray<NSString *>)

@end

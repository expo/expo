/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI25_0_0RNSVGRenderableManager.h"

#import "ABI25_0_0RCTConvert+RNSVG.h"
#import "ABI25_0_0RNSVGCGFCRule.h"

@implementation ABI25_0_0RNSVGRenderableManager

ABI25_0_0RCT_EXPORT_MODULE()

- (ABI25_0_0RNSVGRenderable *)node
{
    return [ABI25_0_0RNSVGRenderable new];
}

ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(fill, ABI25_0_0RNSVGBrush)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(fillOpacity, CGFloat)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(fillRule, ABI25_0_0RNSVGCGFCRule)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(stroke, ABI25_0_0RNSVGBrush)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(strokeOpacity, CGFloat)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinecap, CGLineCap)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinejoin, CGLineJoin)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDasharray, ABI25_0_0RNSVGCGFloatArray)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDashoffset, CGFloat)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(strokeMiterlimit, CGFloat)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(propList, NSArray<NSString *>)

@end

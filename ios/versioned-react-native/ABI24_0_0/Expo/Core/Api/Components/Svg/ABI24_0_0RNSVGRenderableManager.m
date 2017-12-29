/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI24_0_0RNSVGRenderableManager.h"

#import "ABI24_0_0RCTConvert+RNSVG.h"
#import "ABI24_0_0RNSVGCGFCRule.h"

@implementation ABI24_0_0RNSVGRenderableManager

ABI24_0_0RCT_EXPORT_MODULE()

- (ABI24_0_0RNSVGRenderable *)node
{
    return [ABI24_0_0RNSVGRenderable new];
}

ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(fill, ABI24_0_0RNSVGBrush)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(fillOpacity, CGFloat)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(fillRule, ABI24_0_0RNSVGCGFCRule)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(stroke, ABI24_0_0RNSVGBrush)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(strokeOpacity, CGFloat)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinecap, CGLineCap)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinejoin, CGLineJoin)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDasharray, ABI24_0_0RNSVGCGFloatArray)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDashoffset, CGFloat)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(strokeMiterlimit, CGFloat)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(propList, NSArray<NSString *>)

@end

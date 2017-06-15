/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI18_0_0RNSVGRenderableManager.h"

#import "ABI18_0_0RCTConvert+RNSVG.h"
#import "ABI18_0_0RNSVGCGFCRule.h"

@implementation ABI18_0_0RNSVGRenderableManager

ABI18_0_0RCT_EXPORT_MODULE()

- (ABI18_0_0RNSVGRenderable *)node
{
    return [ABI18_0_0RNSVGRenderable new];
}

ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(fill, ABI18_0_0RNSVGBrush)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(fillOpacity, CGFloat)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(fillRule, ABI18_0_0RNSVGCGFCRule)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(stroke, ABI18_0_0RNSVGBrush)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(strokeOpacity, CGFloat)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinecap, CGLineCap)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinejoin, CGLineJoin)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDasharray, ABI18_0_0RNSVGCGFloatArray)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDashoffset, CGFloat)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(strokeMiterlimit, CGFloat)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(propList, NSArray<NSString *>)

@end

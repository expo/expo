/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI11_0_0RNSVGRenderableManager.h"

#import "ABI11_0_0RCTConvert+RNSVG.h"
#import "ABI11_0_0RNSVGCGFCRule.h"

@implementation ABI11_0_0RNSVGRenderableManager

ABI11_0_0RCT_EXPORT_MODULE()

- (ABI11_0_0RNSVGRenderable *)node
{
    return [ABI11_0_0RNSVGRenderable new];
}

ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(fill, ABI11_0_0RNSVGBrush)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(fillOpacity, CGFloat)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(fillRule, ABI11_0_0RNSVGCGFCRule)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(stroke, ABI11_0_0RNSVGBrush)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(strokeOpacity, CGFloat)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinecap, CGLineCap)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinejoin, CGLineJoin)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDasharray, ABI11_0_0RNSVGCGFloatArray)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDashoffset, CGFloat)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(strokeMiterlimit, CGFloat)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(propList, NSArray<NSString *>)

@end

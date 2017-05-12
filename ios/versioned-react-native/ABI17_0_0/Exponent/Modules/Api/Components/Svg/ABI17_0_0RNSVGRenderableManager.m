/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI17_0_0RNSVGRenderableManager.h"

#import "ABI17_0_0RCTConvert+RNSVG.h"
#import "ABI17_0_0RNSVGCGFCRule.h"

@implementation ABI17_0_0RNSVGRenderableManager

ABI17_0_0RCT_EXPORT_MODULE()

- (ABI17_0_0RNSVGRenderable *)node
{
    return [ABI17_0_0RNSVGRenderable new];
}

ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(fill, ABI17_0_0RNSVGBrush)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(fillOpacity, CGFloat)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(fillRule, ABI17_0_0RNSVGCGFCRule)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(stroke, ABI17_0_0RNSVGBrush)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(strokeOpacity, CGFloat)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinecap, CGLineCap)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinejoin, CGLineJoin)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDasharray, ABI17_0_0RNSVGCGFloatArray)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDashoffset, CGFloat)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(strokeMiterlimit, CGFloat)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(propList, NSArray<NSString *>)

@end

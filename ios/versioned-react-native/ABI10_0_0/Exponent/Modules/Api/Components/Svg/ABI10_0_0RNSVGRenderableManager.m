/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI10_0_0RNSVGRenderableManager.h"

#import "ABI10_0_0RCTConvert+RNSVG.h"
#import "ABI10_0_0RNSVGCGFCRule.h"

@implementation ABI10_0_0RNSVGRenderableManager

ABI10_0_0RCT_EXPORT_MODULE()

- (ABI10_0_0RNSVGRenderable *)node
{
    return [ABI10_0_0RNSVGRenderable new];
}

ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(fill, ABI10_0_0RNSVGBrush)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(fillOpacity, CGFloat)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(fillRule, ABI10_0_0RNSVGCGFCRule)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(stroke, ABI10_0_0RNSVGBrush)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(strokeOpacity, CGFloat)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinecap, CGLineCap)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinejoin, CGLineJoin)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDasharray, ABI10_0_0RNSVGCGFloatArray)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDashoffset, CGFloat)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(strokeMiterlimit, CGFloat)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(propList, NSArray<NSString *>)

@end

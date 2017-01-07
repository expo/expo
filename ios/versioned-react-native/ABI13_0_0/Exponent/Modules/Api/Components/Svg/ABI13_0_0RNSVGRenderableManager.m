/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI13_0_0RNSVGRenderableManager.h"

#import "ABI13_0_0RCTConvert+RNSVG.h"
#import "ABI13_0_0RNSVGCGFCRule.h"

@implementation ABI13_0_0RNSVGRenderableManager

ABI13_0_0RCT_EXPORT_MODULE()

- (ABI13_0_0RNSVGRenderable *)node
{
    return [ABI13_0_0RNSVGRenderable new];
}

ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(fill, ABI13_0_0RNSVGBrush)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(fillOpacity, CGFloat)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(fillRule, ABI13_0_0RNSVGCGFCRule)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(stroke, ABI13_0_0RNSVGBrush)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(strokeOpacity, CGFloat)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinecap, CGLineCap)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinejoin, CGLineJoin)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDasharray, ABI13_0_0RNSVGCGFloatArray)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDashoffset, CGFloat)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(strokeMiterlimit, CGFloat)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(propList, NSArray<NSString *>)

@end

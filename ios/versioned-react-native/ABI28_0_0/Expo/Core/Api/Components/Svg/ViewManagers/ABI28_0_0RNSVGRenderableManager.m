/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI28_0_0RNSVGRenderableManager.h"

#import "ABI28_0_0RCTConvert+RNSVG.h"
#import "ABI28_0_0RNSVGCGFCRule.h"

@implementation ABI28_0_0RNSVGRenderableManager

ABI28_0_0RCT_EXPORT_MODULE()

- (ABI28_0_0RNSVGRenderable *)node
{
    return [ABI28_0_0RNSVGRenderable new];
}

ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(fill, ABI28_0_0RNSVGBrush)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(fillOpacity, CGFloat)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(fillRule, ABI28_0_0RNSVGCGFCRule)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(stroke, ABI28_0_0RNSVGBrush)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(strokeOpacity, CGFloat)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, NSString)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinecap, CGLineCap)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinejoin, CGLineJoin)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDasharray, NSArray<NSString *>)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDashoffset, CGFloat)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(strokeMiterlimit, CGFloat)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(propList, NSArray<NSString *>)

@end

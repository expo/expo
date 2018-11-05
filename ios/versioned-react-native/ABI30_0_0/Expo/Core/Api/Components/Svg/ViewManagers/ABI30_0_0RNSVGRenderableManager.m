/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI30_0_0RNSVGRenderableManager.h"

#import "ABI30_0_0RCTConvert+RNSVG.h"
#import "ABI30_0_0RNSVGCGFCRule.h"

@implementation ABI30_0_0RNSVGRenderableManager

ABI30_0_0RCT_EXPORT_MODULE()

- (ABI30_0_0RNSVGRenderable *)node
{
    return [ABI30_0_0RNSVGRenderable new];
}

ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(fill, ABI30_0_0RNSVGBrush)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(fillOpacity, CGFloat)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(fillRule, ABI30_0_0RNSVGCGFCRule)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(stroke, ABI30_0_0RNSVGBrush)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(strokeOpacity, CGFloat)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, NSString)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinecap, CGLineCap)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinejoin, CGLineJoin)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDasharray, NSArray<NSString *>)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDashoffset, CGFloat)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(strokeMiterlimit, CGFloat)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(propList, NSArray<NSString *>)

@end

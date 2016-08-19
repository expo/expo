/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI9_0_0RNSVGRenderableManager.h"

#import "ABI9_0_0RCTConvert+RNSVG.h"
#import "ABI9_0_0RNSVGCGFCRule.h"

@implementation ABI9_0_0RNSVGRenderableManager

ABI9_0_0RCT_EXPORT_MODULE()

- (ABI9_0_0RNSVGRenderable *)node
{
    return [ABI9_0_0RNSVGRenderable new];
}

ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(fill, ABI9_0_0RNSVGBrush)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(fillOpacity, CGFloat)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(fillRule, ABI9_0_0RNSVGCGFCRule)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(stroke, ABI9_0_0RNSVGBrush)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(strokeOpacity, CGFloat)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinecap, CGLineCap)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinejoin, CGLineJoin)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDasharray, ABI9_0_0RNSVGCGFloatArray)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDashoffset, CGFloat)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(strokeMiterlimit, CGFloat)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(propList, NSArray<NSString *>)

@end

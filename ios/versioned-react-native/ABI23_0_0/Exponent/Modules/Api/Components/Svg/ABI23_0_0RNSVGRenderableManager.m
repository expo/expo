/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI23_0_0RNSVGRenderableManager.h"

#import "ABI23_0_0RCTConvert+RNSVG.h"
#import "ABI23_0_0RNSVGCGFCRule.h"

@implementation ABI23_0_0RNSVGRenderableManager

ABI23_0_0RCT_EXPORT_MODULE()

- (ABI23_0_0RNSVGRenderable *)node
{
    return [ABI23_0_0RNSVGRenderable new];
}

ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(fill, ABI23_0_0RNSVGBrush)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(fillOpacity, CGFloat)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(fillRule, ABI23_0_0RNSVGCGFCRule)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(stroke, ABI23_0_0RNSVGBrush)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(strokeOpacity, CGFloat)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinecap, CGLineCap)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinejoin, CGLineJoin)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDasharray, ABI23_0_0RNSVGCGFloatArray)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDashoffset, CGFloat)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(strokeMiterlimit, CGFloat)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(propList, NSArray<NSString *>)

@end

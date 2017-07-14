/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI19_0_0RNSVGRenderableManager.h"

#import "ABI19_0_0RCTConvert+RNSVG.h"
#import "ABI19_0_0RNSVGCGFCRule.h"

@implementation ABI19_0_0RNSVGRenderableManager

ABI19_0_0RCT_EXPORT_MODULE()

- (ABI19_0_0RNSVGRenderable *)node
{
    return [ABI19_0_0RNSVGRenderable new];
}

ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(fill, ABI19_0_0RNSVGBrush)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(fillOpacity, CGFloat)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(fillRule, ABI19_0_0RNSVGCGFCRule)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(stroke, ABI19_0_0RNSVGBrush)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(strokeOpacity, CGFloat)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinecap, CGLineCap)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinejoin, CGLineJoin)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDasharray, ABI19_0_0RNSVGCGFloatArray)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDashoffset, CGFloat)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(strokeMiterlimit, CGFloat)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(propList, NSArray<NSString *>)

@end

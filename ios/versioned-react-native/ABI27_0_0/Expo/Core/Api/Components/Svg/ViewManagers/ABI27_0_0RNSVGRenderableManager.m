/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI27_0_0RNSVGRenderableManager.h"

#import "ABI27_0_0RCTConvert+RNSVG.h"
#import "ABI27_0_0RNSVGCGFCRule.h"

@implementation ABI27_0_0RNSVGRenderableManager

ABI27_0_0RCT_EXPORT_MODULE()

- (ABI27_0_0RNSVGRenderable *)node
{
    return [ABI27_0_0RNSVGRenderable new];
}

ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(fill, ABI27_0_0RNSVGBrush)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(fillOpacity, CGFloat)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(fillRule, ABI27_0_0RNSVGCGFCRule)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(stroke, ABI27_0_0RNSVGBrush)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(strokeOpacity, CGFloat)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, NSString)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinecap, CGLineCap)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinejoin, CGLineJoin)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDasharray, NSArray<NSString *>)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDashoffset, CGFloat)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(strokeMiterlimit, CGFloat)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(propList, NSArray<NSString *>)

@end

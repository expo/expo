/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI22_0_0RNSVGRenderableManager.h"

#import "ABI22_0_0RCTConvert+RNSVG.h"
#import "ABI22_0_0RNSVGCGFCRule.h"

@implementation ABI22_0_0RNSVGRenderableManager

ABI22_0_0RCT_EXPORT_MODULE()

- (ABI22_0_0RNSVGRenderable *)node
{
    return [ABI22_0_0RNSVGRenderable new];
}

ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(fill, ABI22_0_0RNSVGBrush)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(fillOpacity, CGFloat)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(fillRule, ABI22_0_0RNSVGCGFCRule)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(stroke, ABI22_0_0RNSVGBrush)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(strokeOpacity, CGFloat)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinecap, CGLineCap)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinejoin, CGLineJoin)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDasharray, ABI22_0_0RNSVGCGFloatArray)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDashoffset, CGFloat)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(strokeMiterlimit, CGFloat)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(propList, NSArray<NSString *>)

@end

/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RNSVGRenderableManager.h"
#import <ABI49_0_0React/ABI49_0_0RCTBridge.h>
#import <ABI49_0_0React/ABI49_0_0RCTUIManager.h>
#import <ABI49_0_0React/ABI49_0_0RCTUIManagerUtils.h>
#import "ABI49_0_0RNSVGPathMeasure.h"

#import "ABI49_0_0RCTConvert+RNSVG.h"
#import "ABI49_0_0RNSVGCGFCRule.h"

@implementation ABI49_0_0RNSVGRenderableManager

ABI49_0_0RCT_EXPORT_MODULE()

- (ABI49_0_0RNSVGRenderable *)node
{
  return [ABI49_0_0RNSVGRenderable new];
}

ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(fill, ABI49_0_0RNSVGBrush)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(fillOpacity, CGFloat)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(fillRule, ABI49_0_0RNSVGCGFCRule)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(stroke, ABI49_0_0RNSVGBrush)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(strokeOpacity, CGFloat)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, ABI49_0_0RNSVGLength *)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinecap, CGLineCap)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinejoin, CGLineJoin)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDasharray, NSArray<ABI49_0_0RNSVGLength *>)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDashoffset, CGFloat)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(strokeMiterlimit, CGFloat)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(vectorEffect, int)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(propList, NSArray<NSString *>)

@end

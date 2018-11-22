/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0ARTRenderableManager.h"

#import "ABI31_0_0RCTConvert+ART.h"

@implementation ABI31_0_0ARTRenderableManager

ABI31_0_0RCT_EXPORT_MODULE()

- (ABI31_0_0ARTRenderable *)node
{
  return [ABI31_0_0ARTRenderable new];
}

ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(strokeCap, CGLineCap)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(strokeJoin, CGLineJoin)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(fill, ABI31_0_0ARTBrush)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(stroke, CGColor)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDash, ABI31_0_0ARTCGFloatArray)

@end

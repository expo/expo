/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI32_0_0ARTRenderableManager.h"

#import "ABI32_0_0RCTConvert+ART.h"

@implementation ABI32_0_0ARTRenderableManager

ABI32_0_0RCT_EXPORT_MODULE()

- (ABI32_0_0ARTRenderable *)node
{
  return [ABI32_0_0ARTRenderable new];
}

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(strokeCap, CGLineCap)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(strokeJoin, CGLineJoin)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(fill, ABI32_0_0ARTBrush)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(stroke, CGColor)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDash, ABI32_0_0ARTCGFloatArray)

@end

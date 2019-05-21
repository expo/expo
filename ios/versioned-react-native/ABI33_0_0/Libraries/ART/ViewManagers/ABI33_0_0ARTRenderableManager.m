/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI33_0_0ARTRenderableManager.h"

#import "ABI33_0_0RCTConvert+ART.h"

@implementation ABI33_0_0ARTRenderableManager

ABI33_0_0RCT_EXPORT_MODULE()

- (ABI33_0_0ARTRenderable *)node
{
  return [ABI33_0_0ARTRenderable new];
}

ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(strokeCap, CGLineCap)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(strokeJoin, CGLineJoin)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(fill, ABI33_0_0ARTBrush)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(stroke, CGColor)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDash, ABI33_0_0ARTCGFloatArray)

@end

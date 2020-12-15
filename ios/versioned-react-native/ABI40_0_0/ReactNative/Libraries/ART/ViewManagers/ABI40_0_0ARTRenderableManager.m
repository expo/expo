/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI40_0_0React/ABI40_0_0ARTRenderableManager.h>

#import "ABI40_0_0RCTConvert+ART.h"

@implementation ABI40_0_0ARTRenderableManager

ABI40_0_0RCT_EXPORT_MODULE()

- (ABI40_0_0ARTRenderable *)node
{
  return [ABI40_0_0ARTRenderable new];
}

ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(strokeCap, CGLineCap)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(strokeJoin, CGLineJoin)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(fill, ABI40_0_0ARTBrush)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(stroke, CGColor)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDash, ABI40_0_0ARTCGFloatArray)

@end

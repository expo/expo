/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI41_0_0React/ABI41_0_0ARTRenderableManager.h>

#import "ABI41_0_0RCTConvert+ART.h"

@implementation ABI41_0_0ARTRenderableManager

ABI41_0_0RCT_EXPORT_MODULE()

- (ABI41_0_0ARTRenderable *)node
{
  return [ABI41_0_0ARTRenderable new];
}

ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(strokeCap, CGLineCap)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(strokeJoin, CGLineJoin)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(fill, ABI41_0_0ARTBrush)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(stroke, CGColor)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDash, ABI41_0_0ARTCGFloatArray)

@end

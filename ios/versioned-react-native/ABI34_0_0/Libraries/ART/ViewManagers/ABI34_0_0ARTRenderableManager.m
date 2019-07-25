/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI34_0_0ARTRenderableManager.h"

#import "ABI34_0_0RCTConvert+ART.h"

@implementation ABI34_0_0ARTRenderableManager

ABI34_0_0RCT_EXPORT_MODULE()

- (ABI34_0_0ARTRenderable *)node
{
  return [ABI34_0_0ARTRenderable new];
}

ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(strokeCap, CGLineCap)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(strokeJoin, CGLineJoin)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(fill, ABI34_0_0ARTBrush)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(stroke, CGColor)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDash, ABI34_0_0ARTCGFloatArray)

@end

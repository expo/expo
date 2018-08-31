/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI30_0_0ARTRenderableManager.h"

#import "ABI30_0_0RCTConvert+ART.h"

@implementation ABI30_0_0ARTRenderableManager

ABI30_0_0RCT_EXPORT_MODULE()

- (ABI30_0_0ARTRenderable *)node
{
  return [ABI30_0_0ARTRenderable new];
}

ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(strokeCap, CGLineCap)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(strokeJoin, CGLineJoin)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(fill, ABI30_0_0ARTBrush)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(stroke, CGColor)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDash, ABI30_0_0ARTCGFloatArray)

@end

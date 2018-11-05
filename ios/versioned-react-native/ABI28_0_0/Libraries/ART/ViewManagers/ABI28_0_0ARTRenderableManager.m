/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI28_0_0ARTRenderableManager.h"

#import "ABI28_0_0RCTConvert+ART.h"

@implementation ABI28_0_0ARTRenderableManager

ABI28_0_0RCT_EXPORT_MODULE()

- (ABI28_0_0ARTRenderable *)node
{
  return [ABI28_0_0ARTRenderable new];
}

ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(strokeCap, CGLineCap)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(strokeJoin, CGLineJoin)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(fill, ABI28_0_0ARTBrush)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(stroke, CGColor)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDash, ABI28_0_0ARTCGFloatArray)

@end

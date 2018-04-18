/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI27_0_0ARTRenderableManager.h"

#import "ABI27_0_0RCTConvert+ART.h"

@implementation ABI27_0_0ARTRenderableManager

ABI27_0_0RCT_EXPORT_MODULE()

- (ABI27_0_0ARTRenderable *)node
{
  return [ABI27_0_0ARTRenderable new];
}

ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(strokeCap, CGLineCap)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(strokeJoin, CGLineJoin)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(fill, ABI27_0_0ARTBrush)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(stroke, CGColor)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDash, ABI27_0_0ARTCGFloatArray)

@end

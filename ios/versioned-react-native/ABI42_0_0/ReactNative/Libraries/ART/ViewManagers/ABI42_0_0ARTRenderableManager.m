/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI42_0_0React/ABI42_0_0ARTRenderableManager.h>

#import "ABI42_0_0RCTConvert+ART.h"

@implementation ABI42_0_0ARTRenderableManager

ABI42_0_0RCT_EXPORT_MODULE()

- (ABI42_0_0ARTRenderable *)node
{
  return [ABI42_0_0ARTRenderable new];
}

ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(strokeCap, CGLineCap)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(strokeJoin, CGLineJoin)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(fill, ABI42_0_0ARTBrush)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(stroke, CGColor)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDash, ABI42_0_0ARTCGFloatArray)

@end

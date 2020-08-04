/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI38_0_0React/ABI38_0_0ARTRenderableManager.h>

#import "ABI38_0_0RCTConvert+ART.h"

@implementation ABI38_0_0ARTRenderableManager

ABI38_0_0RCT_EXPORT_MODULE()

- (ABI38_0_0ARTRenderable *)node
{
  return [ABI38_0_0ARTRenderable new];
}

ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(strokeCap, CGLineCap)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(strokeJoin, CGLineJoin)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(fill, ABI38_0_0ARTBrush)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(stroke, CGColor)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDash, ABI38_0_0ARTCGFloatArray)

@end

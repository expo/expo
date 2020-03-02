/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI37_0_0React/ABI37_0_0ARTRenderableManager.h>

#import "ABI37_0_0RCTConvert+ART.h"

@implementation ABI37_0_0ARTRenderableManager

ABI37_0_0RCT_EXPORT_MODULE()

- (ABI37_0_0ARTRenderable *)node
{
  return [ABI37_0_0ARTRenderable new];
}

ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(strokeCap, CGLineCap)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(strokeJoin, CGLineJoin)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(fill, ABI37_0_0ARTBrush)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(stroke, CGColor)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDash, ABI37_0_0ARTCGFloatArray)

@end

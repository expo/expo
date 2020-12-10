/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI39_0_0React/ABI39_0_0ARTRenderableManager.h>

#import "ABI39_0_0RCTConvert+ART.h"

@implementation ABI39_0_0ARTRenderableManager

ABI39_0_0RCT_EXPORT_MODULE()

- (ABI39_0_0ARTRenderable *)node
{
  return [ABI39_0_0ARTRenderable new];
}

ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(strokeCap, CGLineCap)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(strokeJoin, CGLineJoin)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(fill, ABI39_0_0ARTBrush)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(stroke, CGColor)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDash, ABI39_0_0ARTCGFloatArray)

@end

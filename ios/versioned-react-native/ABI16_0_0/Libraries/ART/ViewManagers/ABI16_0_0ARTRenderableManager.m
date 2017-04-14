/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI16_0_0ARTRenderableManager.h"

#import "ABI16_0_0RCTConvert+ART.h"

@implementation ABI16_0_0ARTRenderableManager

ABI16_0_0RCT_EXPORT_MODULE()

- (ABI16_0_0ARTRenderable *)node
{
  return [ABI16_0_0ARTRenderable new];
}

ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(strokeCap, CGLineCap)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(strokeJoin, CGLineJoin)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(fill, ABI16_0_0ARTBrush)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(stroke, CGColor)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDash, ABI16_0_0ARTCGFloatArray)

@end

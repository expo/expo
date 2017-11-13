/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI23_0_0ARTRenderableManager.h"

#import "ABI23_0_0RCTConvert+ART.h"

@implementation ABI23_0_0ARTRenderableManager

ABI23_0_0RCT_EXPORT_MODULE()

- (ABI23_0_0ARTRenderable *)node
{
  return [ABI23_0_0ARTRenderable new];
}

ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(strokeCap, CGLineCap)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(strokeJoin, CGLineJoin)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(fill, ABI23_0_0ARTBrush)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(stroke, CGColor)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDash, ABI23_0_0ARTCGFloatArray)

@end

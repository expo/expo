/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI13_0_0ARTRenderableManager.h"

#import "ABI13_0_0RCTConvert+ART.h"

@implementation ABI13_0_0ARTRenderableManager

ABI13_0_0RCT_EXPORT_MODULE()

- (ABI13_0_0ARTRenderable *)node
{
  return [ABI13_0_0ARTRenderable new];
}

ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(strokeCap, CGLineCap)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(strokeJoin, CGLineJoin)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(fill, ABI13_0_0ARTBrush)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(stroke, CGColor)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDash, ABI13_0_0ARTCGFloatArray)

@end

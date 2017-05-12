/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI17_0_0ARTRenderableManager.h"

#import "ABI17_0_0RCTConvert+ART.h"

@implementation ABI17_0_0ARTRenderableManager

ABI17_0_0RCT_EXPORT_MODULE()

- (ABI17_0_0ARTRenderable *)node
{
  return [ABI17_0_0ARTRenderable new];
}

ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(strokeCap, CGLineCap)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(strokeJoin, CGLineJoin)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(fill, ABI17_0_0ARTBrush)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(stroke, CGColor)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDash, ABI17_0_0ARTCGFloatArray)

@end

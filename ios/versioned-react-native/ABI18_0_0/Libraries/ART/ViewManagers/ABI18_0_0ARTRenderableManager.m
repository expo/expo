/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI18_0_0ARTRenderableManager.h"

#import "ABI18_0_0RCTConvert+ART.h"

@implementation ABI18_0_0ARTRenderableManager

ABI18_0_0RCT_EXPORT_MODULE()

- (ABI18_0_0ARTRenderable *)node
{
  return [ABI18_0_0ARTRenderable new];
}

ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(strokeCap, CGLineCap)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(strokeJoin, CGLineJoin)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(fill, ABI18_0_0ARTBrush)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(stroke, CGColor)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDash, ABI18_0_0ARTCGFloatArray)

@end

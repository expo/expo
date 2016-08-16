/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI6_0_0ARTRenderableManager.h"

#import "ABI6_0_0RCTConvert+ART.h"

@implementation ABI6_0_0ARTRenderableManager

ABI6_0_0RCT_EXPORT_MODULE()

- (ABI6_0_0ARTRenderable *)node
{
  return [ABI6_0_0ARTRenderable new];
}

ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(strokeCap, CGLineCap)
ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(strokeJoin, CGLineJoin)
ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(fill, ABI6_0_0ARTBrush)
ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(stroke, CGColor)
ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDash, ABI6_0_0ARTCGFloatArray)

@end

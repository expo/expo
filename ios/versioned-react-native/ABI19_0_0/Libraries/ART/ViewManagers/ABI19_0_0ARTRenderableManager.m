/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI19_0_0ARTRenderableManager.h"

#import "ABI19_0_0RCTConvert+ART.h"

@implementation ABI19_0_0ARTRenderableManager

ABI19_0_0RCT_EXPORT_MODULE()

- (ABI19_0_0ARTRenderable *)node
{
  return [ABI19_0_0ARTRenderable new];
}

ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(strokeCap, CGLineCap)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(strokeJoin, CGLineJoin)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(fill, ABI19_0_0ARTBrush)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(stroke, CGColor)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDash, ABI19_0_0ARTCGFloatArray)

@end

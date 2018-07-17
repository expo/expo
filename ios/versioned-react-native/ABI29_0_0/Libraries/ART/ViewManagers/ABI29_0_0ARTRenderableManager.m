/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI29_0_0ARTRenderableManager.h"

#import "ABI29_0_0RCTConvert+ART.h"

@implementation ABI29_0_0ARTRenderableManager

ABI29_0_0RCT_EXPORT_MODULE()

- (ABI29_0_0ARTRenderable *)node
{
  return [ABI29_0_0ARTRenderable new];
}

ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(strokeCap, CGLineCap)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(strokeJoin, CGLineJoin)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(fill, ABI29_0_0ARTBrush)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(stroke, CGColor)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDash, ABI29_0_0ARTCGFloatArray)

@end

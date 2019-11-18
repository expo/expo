/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI36_0_0React/ABI36_0_0ARTRenderableManager.h>

#import "ABI36_0_0RCTConvert+ART.h"

@implementation ABI36_0_0ARTRenderableManager

ABI36_0_0RCT_EXPORT_MODULE()

- (ABI36_0_0ARTRenderable *)node
{
  return [ABI36_0_0ARTRenderable new];
}

ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(strokeCap, CGLineCap)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(strokeJoin, CGLineJoin)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(fill, ABI36_0_0ARTBrush)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(stroke, CGColor)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDash, ABI36_0_0ARTCGFloatArray)

@end

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI35_0_0ARTRenderableManager.h"

#import "ABI35_0_0RCTConvert+ART.h"

@implementation ABI35_0_0ARTRenderableManager

ABI35_0_0RCT_EXPORT_MODULE()

- (ABI35_0_0ARTRenderable *)node
{
  return [ABI35_0_0ARTRenderable new];
}

ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(strokeCap, CGLineCap)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(strokeJoin, CGLineJoin)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(fill, ABI35_0_0ARTBrush)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(stroke, CGColor)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDash, ABI35_0_0ARTCGFloatArray)

@end

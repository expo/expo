/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI32_0_0ARTTextManager.h"

#import "ABI32_0_0ARTText.h"
#import "ABI32_0_0RCTConvert+ART.h"

@implementation ABI32_0_0ARTTextManager

ABI32_0_0RCT_EXPORT_MODULE()

- (ABI32_0_0ARTRenderable *)node
{
  return [ABI32_0_0ARTText new];
}

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(alignment, CTTextAlignment)
ABI32_0_0RCT_REMAP_VIEW_PROPERTY(frame, textFrame, ABI32_0_0ARTTextFrame)

@end

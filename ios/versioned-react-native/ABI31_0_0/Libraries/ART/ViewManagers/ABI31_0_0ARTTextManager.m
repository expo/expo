/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0ARTTextManager.h"

#import "ABI31_0_0ARTText.h"
#import "ABI31_0_0RCTConvert+ART.h"

@implementation ABI31_0_0ARTTextManager

ABI31_0_0RCT_EXPORT_MODULE()

- (ABI31_0_0ARTRenderable *)node
{
  return [ABI31_0_0ARTText new];
}

ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(alignment, CTTextAlignment)
ABI31_0_0RCT_REMAP_VIEW_PROPERTY(frame, textFrame, ABI31_0_0ARTTextFrame)

@end

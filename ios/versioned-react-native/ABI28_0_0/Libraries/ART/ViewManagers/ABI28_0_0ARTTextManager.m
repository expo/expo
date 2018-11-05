/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI28_0_0ARTTextManager.h"

#import "ABI28_0_0ARTText.h"
#import "ABI28_0_0RCTConvert+ART.h"

@implementation ABI28_0_0ARTTextManager

ABI28_0_0RCT_EXPORT_MODULE()

- (ABI28_0_0ARTRenderable *)node
{
  return [ABI28_0_0ARTText new];
}

ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(alignment, CTTextAlignment)
ABI28_0_0RCT_REMAP_VIEW_PROPERTY(frame, textFrame, ABI28_0_0ARTTextFrame)

@end

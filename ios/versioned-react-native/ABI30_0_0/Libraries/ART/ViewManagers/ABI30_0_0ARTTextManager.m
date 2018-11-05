/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI30_0_0ARTTextManager.h"

#import "ABI30_0_0ARTText.h"
#import "ABI30_0_0RCTConvert+ART.h"

@implementation ABI30_0_0ARTTextManager

ABI30_0_0RCT_EXPORT_MODULE()

- (ABI30_0_0ARTRenderable *)node
{
  return [ABI30_0_0ARTText new];
}

ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(alignment, CTTextAlignment)
ABI30_0_0RCT_REMAP_VIEW_PROPERTY(frame, textFrame, ABI30_0_0ARTTextFrame)

@end

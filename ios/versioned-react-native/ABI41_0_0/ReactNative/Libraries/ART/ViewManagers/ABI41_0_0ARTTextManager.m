/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI41_0_0React/ABI41_0_0ARTTextManager.h>

#import <ABI41_0_0React/ABI41_0_0ARTText.h>
#import "ABI41_0_0RCTConvert+ART.h"

@implementation ABI41_0_0ARTTextManager

ABI41_0_0RCT_EXPORT_MODULE()

- (ABI41_0_0ARTRenderable *)node
{
  return [ABI41_0_0ARTText new];
}

ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(alignment, CTTextAlignment)
ABI41_0_0RCT_REMAP_VIEW_PROPERTY(frame, textFrame, ABI41_0_0ARTTextFrame)

@end

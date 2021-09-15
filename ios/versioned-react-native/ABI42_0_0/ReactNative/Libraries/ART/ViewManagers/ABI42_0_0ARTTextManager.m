/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI42_0_0React/ABI42_0_0ARTTextManager.h>

#import <ABI42_0_0React/ABI42_0_0ARTText.h>
#import "ABI42_0_0RCTConvert+ART.h"

@implementation ABI42_0_0ARTTextManager

ABI42_0_0RCT_EXPORT_MODULE()

- (ABI42_0_0ARTRenderable *)node
{
  return [ABI42_0_0ARTText new];
}

ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(alignment, CTTextAlignment)
ABI42_0_0RCT_REMAP_VIEW_PROPERTY(frame, textFrame, ABI42_0_0ARTTextFrame)

@end

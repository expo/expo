/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI29_0_0ARTTextManager.h"

#import "ABI29_0_0ARTText.h"
#import "ABI29_0_0RCTConvert+ART.h"

@implementation ABI29_0_0ARTTextManager

ABI29_0_0RCT_EXPORT_MODULE()

- (ABI29_0_0ARTRenderable *)node
{
  return [ABI29_0_0ARTText new];
}

ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(alignment, CTTextAlignment)
ABI29_0_0RCT_REMAP_VIEW_PROPERTY(frame, textFrame, ABI29_0_0ARTTextFrame)

@end

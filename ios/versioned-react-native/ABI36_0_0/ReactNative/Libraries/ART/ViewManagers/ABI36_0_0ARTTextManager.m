/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI36_0_0React/ABI36_0_0ARTTextManager.h>

#import <ABI36_0_0React/ABI36_0_0ARTText.h>
#import "ABI36_0_0RCTConvert+ART.h"

@implementation ABI36_0_0ARTTextManager

ABI36_0_0RCT_EXPORT_MODULE()

- (ABI36_0_0ARTRenderable *)node
{
  return [ABI36_0_0ARTText new];
}

ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(alignment, CTTextAlignment)
ABI36_0_0RCT_REMAP_VIEW_PROPERTY(frame, textFrame, ABI36_0_0ARTTextFrame)

@end

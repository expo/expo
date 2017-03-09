/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI15_0_0RNSVGTextManager.h"

#import "ABI15_0_0RNSVGText.h"
#import "ABI15_0_0RCTConvert+RNSVG.h"

@implementation ABI15_0_0RNSVGTextManager

ABI15_0_0RCT_EXPORT_MODULE()

- (ABI15_0_0RNSVGRenderable *)node
{
  return [ABI15_0_0RNSVGText new];
}

ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(alignment, CTTextAlignment)
ABI15_0_0RCT_REMAP_VIEW_PROPERTY(frame, textFrame, ABI15_0_0RNSVGTextFrame)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(path, ABI15_0_0RNSVGBezier)

@end

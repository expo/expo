/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI14_0_0RNSVGTextManager.h"

#import "ABI14_0_0RNSVGText.h"
#import "ABI14_0_0RCTConvert+RNSVG.h"

@implementation ABI14_0_0RNSVGTextManager

ABI14_0_0RCT_EXPORT_MODULE()

- (ABI14_0_0RNSVGRenderable *)node
{
  return [ABI14_0_0RNSVGText new];
}

ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(alignment, CTTextAlignment)
ABI14_0_0RCT_REMAP_VIEW_PROPERTY(frame, textFrame, ABI14_0_0RNSVGTextFrame)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(path, ABI14_0_0RNSVGBezier)

@end

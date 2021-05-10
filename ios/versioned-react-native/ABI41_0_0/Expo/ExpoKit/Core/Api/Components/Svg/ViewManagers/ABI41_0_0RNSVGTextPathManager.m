/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI41_0_0RNSVGTextPathManager.h"

#import "ABI41_0_0RNSVGTextPath.h"

@implementation ABI41_0_0RNSVGTextPathManager

ABI41_0_0RCT_EXPORT_MODULE()

- (ABI41_0_0RNSVGRenderable *)node
{
  return [ABI41_0_0RNSVGTextPath new];
}

ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(href, NSString)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(side, NSString)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(method, NSString)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(midLine, NSString)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(spacing, NSString)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(startOffset, ABI41_0_0RNSVGLength*)

@end

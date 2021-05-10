/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI40_0_0RNSVGTextPathManager.h"

#import "ABI40_0_0RNSVGTextPath.h"

@implementation ABI40_0_0RNSVGTextPathManager

ABI40_0_0RCT_EXPORT_MODULE()

- (ABI40_0_0RNSVGRenderable *)node
{
  return [ABI40_0_0RNSVGTextPath new];
}

ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(href, NSString)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(side, NSString)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(method, NSString)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(midLine, NSString)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(spacing, NSString)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(startOffset, ABI40_0_0RNSVGLength*)

@end

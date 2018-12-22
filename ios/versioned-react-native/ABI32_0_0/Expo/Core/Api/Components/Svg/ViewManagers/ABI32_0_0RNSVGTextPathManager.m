/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI32_0_0RNSVGTextPathManager.h"

#import "ABI32_0_0RNSVGTextPath.h"

@implementation ABI32_0_0RNSVGTextPathManager

ABI32_0_0RCT_EXPORT_MODULE()

- (ABI32_0_0RNSVGRenderable *)node
{
  return [ABI32_0_0RNSVGTextPath new];
}

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(href, NSString)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(side, NSString)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(method, NSString)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(midLine, NSString)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(spacing, NSString)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(startOffset, ABI32_0_0RNSVGLength*)

@end

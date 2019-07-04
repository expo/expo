/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0RNSVGTextPathManager.h"

#import "ABI31_0_0RNSVGTextPath.h"

@implementation ABI31_0_0RNSVGTextPathManager

ABI31_0_0RCT_EXPORT_MODULE()

- (ABI31_0_0RNSVGRenderable *)node
{
  return [ABI31_0_0RNSVGTextPath new];
}

ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(href, NSString)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(side, NSString)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(method, NSString)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(midLine, NSString)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(spacing, NSString)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(startOffset, ABI31_0_0RNSVGLength*)

@end

/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI33_0_0RNSVGTextPathManager.h"

#import "ABI33_0_0RNSVGTextPath.h"

@implementation ABI33_0_0RNSVGTextPathManager

ABI33_0_0RCT_EXPORT_MODULE()

- (ABI33_0_0RNSVGRenderable *)node
{
  return [ABI33_0_0RNSVGTextPath new];
}

ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(href, NSString)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(side, NSString)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(method, NSString)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(midLine, NSString)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(spacing, NSString)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(startOffset, ABI33_0_0RNSVGLength*)

@end

/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI42_0_0RNSVGTextPathManager.h"

#import "ABI42_0_0RNSVGTextPath.h"

@implementation ABI42_0_0RNSVGTextPathManager

ABI42_0_0RCT_EXPORT_MODULE()

- (ABI42_0_0RNSVGRenderable *)node
{
  return [ABI42_0_0RNSVGTextPath new];
}

ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(href, NSString)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(side, NSString)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(method, NSString)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(midLine, NSString)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(spacing, NSString)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(startOffset, ABI42_0_0RNSVGLength*)

@end

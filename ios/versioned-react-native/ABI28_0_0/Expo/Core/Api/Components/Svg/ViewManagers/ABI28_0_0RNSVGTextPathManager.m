/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI28_0_0RNSVGTextPathManager.h"

#import "ABI28_0_0RNSVGTextPath.h"

@implementation ABI28_0_0RNSVGTextPathManager

ABI28_0_0RCT_EXPORT_MODULE()

- (ABI28_0_0RNSVGRenderable *)node
{
  return [ABI28_0_0RNSVGTextPath new];
}

ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(href, NSString)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(side, NSString)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(method, NSString)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(midLine, NSString)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(spacing, NSString)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(startOffset, NSString)

@end

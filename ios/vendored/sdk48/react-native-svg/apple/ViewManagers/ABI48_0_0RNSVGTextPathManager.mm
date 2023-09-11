/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RNSVGTextPathManager.h"

#import "ABI48_0_0RNSVGTextPath.h"

@implementation ABI48_0_0RNSVGTextPathManager

ABI48_0_0RCT_EXPORT_MODULE()

- (ABI48_0_0RNSVGRenderable *)node
{
  return [ABI48_0_0RNSVGTextPath new];
}

ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(href, NSString)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(side, NSString)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(method, NSString)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(midLine, NSString)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(spacing, NSString)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(startOffset, ABI48_0_0RNSVGLength *)

@end

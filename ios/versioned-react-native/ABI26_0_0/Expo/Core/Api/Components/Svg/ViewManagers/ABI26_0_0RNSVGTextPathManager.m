/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI26_0_0RNSVGTextPathManager.h"

#import "ABI26_0_0RNSVGTextPath.h"

@implementation ABI26_0_0RNSVGTextPathManager

ABI26_0_0RCT_EXPORT_MODULE()

- (ABI26_0_0RNSVGRenderable *)node
{
  return [ABI26_0_0RNSVGTextPath new];
}

ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(href, NSString)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(side, NSString)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(method, NSString)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(midLine, NSString)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(spacing, NSString)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(startOffset, NSString)

@end

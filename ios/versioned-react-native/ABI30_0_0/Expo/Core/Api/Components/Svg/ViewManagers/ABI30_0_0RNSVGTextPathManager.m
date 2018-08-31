/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI30_0_0RNSVGTextPathManager.h"

#import "ABI30_0_0RNSVGTextPath.h"

@implementation ABI30_0_0RNSVGTextPathManager

ABI30_0_0RCT_EXPORT_MODULE()

- (ABI30_0_0RNSVGRenderable *)node
{
  return [ABI30_0_0RNSVGTextPath new];
}

ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(href, NSString)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(side, NSString)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(method, NSString)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(midLine, NSString)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(spacing, NSString)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(startOffset, NSString)

@end

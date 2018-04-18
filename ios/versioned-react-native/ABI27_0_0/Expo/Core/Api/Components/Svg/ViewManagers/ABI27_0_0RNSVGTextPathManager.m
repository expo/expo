/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI27_0_0RNSVGTextPathManager.h"

#import "ABI27_0_0RNSVGTextPath.h"

@implementation ABI27_0_0RNSVGTextPathManager

ABI27_0_0RCT_EXPORT_MODULE()

- (ABI27_0_0RNSVGRenderable *)node
{
  return [ABI27_0_0RNSVGTextPath new];
}

ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(href, NSString)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(side, NSString)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(method, NSString)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(midLine, NSString)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(spacing, NSString)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(startOffset, NSString)

@end

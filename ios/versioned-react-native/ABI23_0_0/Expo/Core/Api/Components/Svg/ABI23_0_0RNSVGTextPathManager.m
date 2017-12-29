/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI23_0_0RNSVGTextPathManager.h"

#import "ABI23_0_0RNSVGTextPath.h"

@implementation ABI23_0_0RNSVGTextPathManager

ABI23_0_0RCT_EXPORT_MODULE()

- (ABI23_0_0RNSVGRenderable *)node
{
  return [ABI23_0_0RNSVGTextPath new];
}

ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(href, NSString)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(startOffset, NSString)

@end

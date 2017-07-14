/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI19_0_0RNSVGTextPathManager.h"

#import "ABI19_0_0RNSVGTextPath.h"

@implementation ABI19_0_0RNSVGTextPathManager

ABI19_0_0RCT_EXPORT_MODULE()

- (ABI19_0_0RNSVGRenderable *)node
{
  return [ABI19_0_0RNSVGTextPath new];
}

ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(href, NSString)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(startOffset, NSString)

@end

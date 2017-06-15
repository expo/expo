/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI18_0_0RNSVGTextPathManager.h"

#import "ABI18_0_0RNSVGTextPath.h"

@implementation ABI18_0_0RNSVGTextPathManager

ABI18_0_0RCT_EXPORT_MODULE()

- (ABI18_0_0RNSVGRenderable *)node
{
  return [ABI18_0_0RNSVGTextPath new];
}

ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(href, NSString)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(startOffset, NSString)

@end

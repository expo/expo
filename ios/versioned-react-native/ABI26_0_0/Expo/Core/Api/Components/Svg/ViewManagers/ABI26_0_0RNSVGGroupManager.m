/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI26_0_0RNSVGGroupManager.h"
#import "ABI26_0_0RNSVGCGFCRule.h"
#import "ABI26_0_0RNSVGGroup.h"

@implementation ABI26_0_0RNSVGGroupManager

ABI26_0_0RCT_EXPORT_MODULE()

- (ABI26_0_0RNSVGNode *)node
{
  return [ABI26_0_0RNSVGGroup new];
}

ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(font, NSDictionary)

@end

/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0RNSVGGroupManager.h"
#import "ABI31_0_0RNSVGCGFCRule.h"
#import "ABI31_0_0RNSVGGroup.h"

@implementation ABI31_0_0RNSVGGroupManager

ABI31_0_0RCT_EXPORT_MODULE()

- (ABI31_0_0RNSVGNode *)node
{
  return [ABI31_0_0RNSVGGroup new];
}

ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(font, NSDictionary)

@end

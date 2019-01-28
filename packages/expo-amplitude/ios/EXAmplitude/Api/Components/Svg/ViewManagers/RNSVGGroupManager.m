/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGGroupManager.h"
#import "RNSVGCGFCRule.h"
#import "RNSVGGroup.h"

@implementation RNSVGGroupManager

RCT_EXPORT_MODULE()

- (RNSVGNode *)node
{
  return [RNSVGGroup new];
}

RCT_EXPORT_VIEW_PROPERTY(font, NSDictionary)

@end

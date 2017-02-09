/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI14_0_0RNSVGUseManager.h"
#import "ABI14_0_0RNSVGUse.h"

@implementation ABI14_0_0RNSVGUseManager

ABI14_0_0RCT_EXPORT_MODULE()

- (ABI14_0_0RNSVGNode *)node
{
  return [ABI14_0_0RNSVGUse new];
}

ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(href, NSString)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(width, NSString)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(height, NSString)

@end

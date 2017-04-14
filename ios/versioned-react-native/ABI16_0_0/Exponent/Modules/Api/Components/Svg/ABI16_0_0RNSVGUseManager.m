/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI16_0_0RNSVGUseManager.h"
#import "ABI16_0_0RNSVGUse.h"

@implementation ABI16_0_0RNSVGUseManager

ABI16_0_0RCT_EXPORT_MODULE()

- (ABI16_0_0RNSVGNode *)node
{
  return [ABI16_0_0RNSVGUse new];
}

ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(href, NSString)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(width, NSString)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(height, NSString)

@end

/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI13_0_0RNSVGUseManager.h"
#import "ABI13_0_0RNSVGUse.h"

@implementation ABI13_0_0RNSVGUseManager

ABI13_0_0RCT_EXPORT_MODULE()

- (ABI13_0_0RNSVGNode *)node
{
  return [ABI13_0_0RNSVGUse new];
}

ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(href, NSString)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(width, NSString)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(height, NSString)

@end

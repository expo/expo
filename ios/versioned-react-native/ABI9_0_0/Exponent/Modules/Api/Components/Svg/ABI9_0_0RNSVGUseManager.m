/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI9_0_0RNSVGUseManager.h"
#import "ABI9_0_0RNSVGUse.h"

@implementation ABI9_0_0RNSVGUseManager

ABI9_0_0RCT_EXPORT_MODULE()

- (ABI9_0_0RNSVGNode *)node
{
  return [ABI9_0_0RNSVGUse new];
}

ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(href, NSString)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(width, NSString)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(height, NSString)

@end

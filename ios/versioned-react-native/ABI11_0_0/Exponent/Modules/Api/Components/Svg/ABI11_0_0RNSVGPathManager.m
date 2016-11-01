/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI11_0_0RNSVGPathManager.h"

#import "ABI11_0_0RNSVGPath.h"
#import "ABI11_0_0RCTConvert+RNSVG.h"

@implementation ABI11_0_0RNSVGPathManager

ABI11_0_0RCT_EXPORT_MODULE()

- (ABI11_0_0RNSVGRenderable *)node
{
  return [ABI11_0_0RNSVGPath new];
}

ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(d, CGPath)

@end

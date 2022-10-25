/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RNSVGPathManager.h"

#import "ABI47_0_0RCTConvert+RNSVG.h"
#import "ABI47_0_0RNSVGPath.h"

@implementation ABI47_0_0RNSVGPathManager

ABI47_0_0RCT_EXPORT_MODULE()

- (ABI47_0_0RNSVGRenderable *)node
{
  return [ABI47_0_0RNSVGPath new];
}

ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(d, ABI47_0_0RNSVGCGPath)

@end

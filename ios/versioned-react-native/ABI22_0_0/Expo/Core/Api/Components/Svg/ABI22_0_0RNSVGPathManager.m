/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI22_0_0RNSVGPathManager.h"

#import "ABI22_0_0RNSVGPath.h"
#import "ABI22_0_0RCTConvert+RNSVG.h"

@implementation ABI22_0_0RNSVGPathManager

ABI22_0_0RCT_EXPORT_MODULE()

- (ABI22_0_0RNSVGRenderable *)node
{
  return [ABI22_0_0RNSVGPath new];
}

ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(d, ABI22_0_0RNSVGCGPath)

@end

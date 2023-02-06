/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RNSVGLineManager.h"

#import "ABI48_0_0RCTConvert+RNSVG.h"
#import "ABI48_0_0RNSVGLine.h"

@implementation ABI48_0_0RNSVGLineManager

ABI48_0_0RCT_EXPORT_MODULE()

- (ABI48_0_0RNSVGRenderable *)node
{
  return [ABI48_0_0RNSVGLine new];
}

ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(x1, ABI48_0_0RNSVGLength *)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(y1, ABI48_0_0RNSVGLength *)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(x2, ABI48_0_0RNSVGLength *)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(y2, ABI48_0_0RNSVGLength *)

@end

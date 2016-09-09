/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI10_0_0RNSVGLineManager.h"

#import "ABI10_0_0RNSVGLine.h"
#import "ABI10_0_0RCTConvert+RNSVG.h"

@implementation ABI10_0_0RNSVGLineManager

ABI10_0_0RCT_EXPORT_MODULE()

- (ABI10_0_0RNSVGRenderable *)node
{
  return [ABI10_0_0RNSVGLine new];
}

ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(x1, NSString)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(y1, NSString)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(x2, NSString)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(y2, NSString)

@end

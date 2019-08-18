/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI32_0_0RNSVGTSpanManager.h"

#import "ABI32_0_0RNSVGTSpan.h"
#import "ABI32_0_0RCTConvert+RNSVG.h"

@implementation ABI32_0_0RNSVGTSpanManager

ABI32_0_0RCT_EXPORT_MODULE()

- (ABI32_0_0RNSVGRenderable *)node
{
  return [ABI32_0_0RNSVGTSpan new];
}

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(content, NSString)

@end

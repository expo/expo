/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI32_0_0RNSVGSymbolManager.h"
#import "ABI32_0_0RNSVGRenderable.h"
#import "ABI32_0_0RNSVGSymbol.h"
#import "ABI32_0_0RCTConvert+RNSVG.h"
#import "ABI32_0_0RNSVGVBMOS.h"

@implementation ABI32_0_0RNSVGSymbolManager

ABI32_0_0RCT_EXPORT_MODULE()

- (ABI32_0_0RNSVGRenderable *)node
{
  return [ABI32_0_0RNSVGSymbol new];
}

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI32_0_0RNSVGVBMOS)

@end

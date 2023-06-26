/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RNSVGSymbolManager.h"
#import "ABI49_0_0RCTConvert+RNSVG.h"
#import "ABI49_0_0RNSVGRenderable.h"
#import "ABI49_0_0RNSVGSymbol.h"
#import "ABI49_0_0RNSVGVBMOS.h"

@implementation ABI49_0_0RNSVGSymbolManager

ABI49_0_0RCT_EXPORT_MODULE()

- (ABI49_0_0RNSVGRenderable *)node
{
  return [ABI49_0_0RNSVGSymbol new];
}

ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI49_0_0RNSVGVBMOS)

@end

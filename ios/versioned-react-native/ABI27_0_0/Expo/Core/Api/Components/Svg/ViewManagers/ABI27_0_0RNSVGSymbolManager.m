/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI27_0_0RNSVGSymbolManager.h"
#import "ABI27_0_0RNSVGRenderable.h"
#import "ABI27_0_0RNSVGSymbol.h"
#import "ABI27_0_0RCTConvert+RNSVG.h"
#import "ABI27_0_0RNSVGVBMOS.h"

@implementation ABI27_0_0RNSVGSymbolManager

ABI27_0_0RCT_EXPORT_MODULE()

- (ABI27_0_0RNSVGRenderable *)node
{
  return [ABI27_0_0RNSVGSymbol new];
}

ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI27_0_0RNSVGVBMOS)

@end

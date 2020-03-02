/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI37_0_0RNSVGSymbolManager.h"
#import "ABI37_0_0RNSVGRenderable.h"
#import "ABI37_0_0RNSVGSymbol.h"
#import "ABI37_0_0RCTConvert+RNSVG.h"
#import "ABI37_0_0RNSVGVBMOS.h"

@implementation ABI37_0_0RNSVGSymbolManager

ABI37_0_0RCT_EXPORT_MODULE()

- (ABI37_0_0RNSVGRenderable *)node
{
  return [ABI37_0_0RNSVGSymbol new];
}

ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI37_0_0RNSVGVBMOS)

@end

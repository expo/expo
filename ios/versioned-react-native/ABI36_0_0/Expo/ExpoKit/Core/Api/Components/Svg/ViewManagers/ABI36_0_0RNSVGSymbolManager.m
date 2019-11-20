/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI36_0_0RNSVGSymbolManager.h"
#import "ABI36_0_0RNSVGRenderable.h"
#import "ABI36_0_0RNSVGSymbol.h"
#import "ABI36_0_0RCTConvert+RNSVG.h"
#import "ABI36_0_0RNSVGVBMOS.h"

@implementation ABI36_0_0RNSVGSymbolManager

ABI36_0_0RCT_EXPORT_MODULE()

- (ABI36_0_0RNSVGRenderable *)node
{
  return [ABI36_0_0RNSVGSymbol new];
}

ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI36_0_0RNSVGVBMOS)

@end

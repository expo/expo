/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI38_0_0RNSVGSymbolManager.h"
#import "ABI38_0_0RNSVGRenderable.h"
#import "ABI38_0_0RNSVGSymbol.h"
#import "ABI38_0_0RCTConvert+RNSVG.h"
#import "ABI38_0_0RNSVGVBMOS.h"

@implementation ABI38_0_0RNSVGSymbolManager

ABI38_0_0RCT_EXPORT_MODULE()

- (ABI38_0_0RNSVGRenderable *)node
{
  return [ABI38_0_0RNSVGSymbol new];
}

ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI38_0_0RNSVGVBMOS)

@end

/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGSymbolManager.h"
#import "RCTConvert+RNSVG.h"
#import "RNSVGRenderable.h"
#import "RNSVGSymbol.h"
#import "RNSVGVBMOS.h"

@implementation RNSVGSymbolManager

RCT_EXPORT_MODULE()

- (RNSVGRenderable *)node
{
  return [RNSVGSymbol new];
}

RCT_EXPORT_VIEW_PROPERTY(minX, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(minY, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(vbWidth, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(vbHeight, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(align, NSString)
RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, RNSVGVBMOS)

@end

/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI15_0_0RNSVGViewBoxManager.h"
#import "ABI15_0_0RNSVGViewBox.h"
#import "ABI15_0_0RNSVGVBMOS.h"

@implementation ABI15_0_0RNSVGViewBoxManager

ABI15_0_0RCT_EXPORT_MODULE()

- (ABI15_0_0RNSVGViewBox *)node
{
  return [ABI15_0_0RNSVGViewBox new];
}

ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(minX, NSString)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(minY, NSString)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, NSString)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, NSString)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI15_0_0RNSVGVBMOS)

@end

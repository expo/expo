/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI12_0_0RNSVGViewBoxManager.h"
#import "ABI12_0_0RNSVGViewBox.h"
#import "ABI12_0_0RNSVGVBMOS.h"

@implementation ABI12_0_0RNSVGViewBoxManager

ABI12_0_0RCT_EXPORT_MODULE()

- (ABI12_0_0RNSVGViewBox *)node
{
  return [ABI12_0_0RNSVGViewBox new];
}

ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(minX, NSString)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(minY, NSString)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, NSString)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, NSString)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI12_0_0RNSVGVBMOS)

@end

/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI10_0_0RNSVGViewBoxManager.h"
#import "ABI10_0_0RNSVGViewBox.h"
#import "ABI10_0_0RNSVGVBMOS.h"

@implementation ABI10_0_0RNSVGViewBoxManager

ABI10_0_0RCT_EXPORT_MODULE()

- (ABI10_0_0RNSVGViewBox *)node
{
  return [ABI10_0_0RNSVGViewBox new];
}

ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(minX, NSString)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(minY, NSString)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, NSString)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, NSString)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI10_0_0RNSVGVBMOS)

@end

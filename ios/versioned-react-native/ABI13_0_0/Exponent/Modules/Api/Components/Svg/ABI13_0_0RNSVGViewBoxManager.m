/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI13_0_0RNSVGViewBoxManager.h"
#import "ABI13_0_0RNSVGViewBox.h"
#import "ABI13_0_0RNSVGVBMOS.h"

@implementation ABI13_0_0RNSVGViewBoxManager

ABI13_0_0RCT_EXPORT_MODULE()

- (ABI13_0_0RNSVGViewBox *)node
{
  return [ABI13_0_0RNSVGViewBox new];
}

ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(minX, NSString)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(minY, NSString)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, NSString)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, NSString)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI13_0_0RNSVGVBMOS)

@end

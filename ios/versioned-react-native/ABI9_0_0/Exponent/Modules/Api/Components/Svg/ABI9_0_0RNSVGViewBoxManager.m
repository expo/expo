/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI9_0_0RNSVGViewBoxManager.h"
#import "ABI9_0_0RNSVGViewBox.h"
#import "ABI9_0_0RNSVGVBMOS.h"

@implementation ABI9_0_0RNSVGViewBoxManager

ABI9_0_0RCT_EXPORT_MODULE()

- (ABI9_0_0RNSVGViewBox *)node
{
  return [ABI9_0_0RNSVGViewBox new];
}

ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(minX, NSString)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(minY, NSString)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(vbWidth, NSString)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(vbHeight, NSString)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI9_0_0RNSVGVBMOS)

@end

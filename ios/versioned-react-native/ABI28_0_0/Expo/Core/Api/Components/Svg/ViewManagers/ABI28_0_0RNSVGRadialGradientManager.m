/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI28_0_0RNSVGRadialGradientManager.h"
#import "ABI28_0_0RNSVGRadialGradient.h"

@implementation ABI28_0_0RNSVGRadialGradientManager

ABI28_0_0RCT_EXPORT_MODULE()

- (ABI28_0_0RNSVGNode *)node
{
  return [ABI28_0_0RNSVGRadialGradient new];
}

ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(fx, NSString)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(fy, NSString)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(rx, NSString)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(ry, NSString)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(cx, NSString)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(cy, NSString)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSArray<NSNumber *>)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(gradientUnits, ABI28_0_0RNSVGUnits)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(gradientTransform, CGAffineTransform)

@end

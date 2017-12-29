/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI22_0_0RNSVGRadialGradientManager.h"
#import "ABI22_0_0RNSVGRadialGradient.h"

@implementation ABI22_0_0RNSVGRadialGradientManager

ABI22_0_0RCT_EXPORT_MODULE()

- (ABI22_0_0RNSVGNode *)node
{
  return [ABI22_0_0RNSVGRadialGradient new];
}

ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(fx, NSString)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(fy, NSString)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(rx, NSString)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(ry, NSString)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(cx, NSString)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(cy, NSString)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSArray<NSNumber *>)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(gradientUnits, ABI22_0_0RNSVGUnits)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(gradientTransform, CGAffineTransform)

@end

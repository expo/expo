/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI23_0_0RNSVGRadialGradientManager.h"
#import "ABI23_0_0RNSVGRadialGradient.h"

@implementation ABI23_0_0RNSVGRadialGradientManager

ABI23_0_0RCT_EXPORT_MODULE()

- (ABI23_0_0RNSVGNode *)node
{
  return [ABI23_0_0RNSVGRadialGradient new];
}

ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(fx, NSString)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(fy, NSString)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(rx, NSString)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(ry, NSString)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(cx, NSString)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(cy, NSString)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSArray<NSNumber *>)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(gradientUnits, ABI23_0_0RNSVGUnits)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(gradientTransform, CGAffineTransform)

@end

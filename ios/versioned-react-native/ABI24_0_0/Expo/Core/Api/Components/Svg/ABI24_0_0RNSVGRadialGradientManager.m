/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI24_0_0RNSVGRadialGradientManager.h"
#import "ABI24_0_0RNSVGRadialGradient.h"

@implementation ABI24_0_0RNSVGRadialGradientManager

ABI24_0_0RCT_EXPORT_MODULE()

- (ABI24_0_0RNSVGNode *)node
{
  return [ABI24_0_0RNSVGRadialGradient new];
}

ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(fx, NSString)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(fy, NSString)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(rx, NSString)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(ry, NSString)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(cx, NSString)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(cy, NSString)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSArray<NSNumber *>)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(gradientUnits, ABI24_0_0RNSVGUnits)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(gradientTransform, CGAffineTransform)

@end

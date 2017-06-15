/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI18_0_0RNSVGRadialGradientManager.h"
#import "ABI18_0_0RNSVGRadialGradient.h"

@implementation ABI18_0_0RNSVGRadialGradientManager

ABI18_0_0RCT_EXPORT_MODULE()

- (ABI18_0_0RNSVGNode *)node
{
  return [ABI18_0_0RNSVGRadialGradient new];
}

ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(fx, NSString)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(fy, NSString)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(rx, NSString)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(ry, NSString)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(cx, NSString)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(cy, NSString)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSArray<NSNumber *>)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(gradientUnits, ABI18_0_0RNSVGUnits)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(gradientTransform, CGAffineTransform)

@end

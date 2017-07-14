/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI19_0_0RNSVGRadialGradientManager.h"
#import "ABI19_0_0RNSVGRadialGradient.h"

@implementation ABI19_0_0RNSVGRadialGradientManager

ABI19_0_0RCT_EXPORT_MODULE()

- (ABI19_0_0RNSVGNode *)node
{
  return [ABI19_0_0RNSVGRadialGradient new];
}

ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(fx, NSString)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(fy, NSString)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(rx, NSString)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(ry, NSString)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(cx, NSString)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(cy, NSString)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSArray<NSNumber *>)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(gradientUnits, ABI19_0_0RNSVGUnits)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(gradientTransform, CGAffineTransform)

@end

/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI17_0_0RNSVGRadialGradientManager.h"
#import "ABI17_0_0RNSVGRadialGradient.h"

@implementation ABI17_0_0RNSVGRadialGradientManager

ABI17_0_0RCT_EXPORT_MODULE()

- (ABI17_0_0RNSVGNode *)node
{
  return [ABI17_0_0RNSVGRadialGradient new];
}

ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(fx, NSString)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(fy, NSString)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(rx, NSString)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(ry, NSString)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(cx, NSString)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(cy, NSString)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSArray<NSNumber *>)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(gradientUnits, ABI17_0_0RNSVGUnits)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(gradientTransform, CGAffineTransform)

@end

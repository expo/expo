/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI29_0_0RNSVGRadialGradientManager.h"
#import "ABI29_0_0RNSVGRadialGradient.h"

@implementation ABI29_0_0RNSVGRadialGradientManager

ABI29_0_0RCT_EXPORT_MODULE()

- (ABI29_0_0RNSVGNode *)node
{
  return [ABI29_0_0RNSVGRadialGradient new];
}

ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(fx, NSString)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(fy, NSString)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(rx, NSString)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(ry, NSString)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(cx, NSString)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(cy, NSString)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSArray<NSNumber *>)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(gradientUnits, ABI29_0_0RNSVGUnits)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(gradientTransform, CGAffineTransform)

@end

/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI32_0_0RNSVGLinearGradientManager.h"
#import "ABI32_0_0RNSVGLinearGradient.h"

@implementation ABI32_0_0RNSVGLinearGradientManager

ABI32_0_0RCT_EXPORT_MODULE()

- (ABI32_0_0RNSVGNode *)node
{
  return [ABI32_0_0RNSVGLinearGradient new];
}

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(x1, ABI32_0_0RNSVGLength*)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(y1, ABI32_0_0RNSVGLength*)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(x2, ABI32_0_0RNSVGLength*)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(y2, ABI32_0_0RNSVGLength*)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSArray<NSNumber *>)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(gradientUnits, ABI32_0_0RNSVGUnits)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(gradientTransform, CGAffineTransform)

@end

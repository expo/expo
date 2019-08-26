/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0RNSVGLinearGradientManager.h"
#import "ABI31_0_0RNSVGLinearGradient.h"

@implementation ABI31_0_0RNSVGLinearGradientManager

ABI31_0_0RCT_EXPORT_MODULE()

- (ABI31_0_0RNSVGNode *)node
{
  return [ABI31_0_0RNSVGLinearGradient new];
}

ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(x1, ABI31_0_0RNSVGLength*)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(y1, ABI31_0_0RNSVGLength*)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(x2, ABI31_0_0RNSVGLength*)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(y2, ABI31_0_0RNSVGLength*)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSArray<NSNumber *>)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(gradientUnits, ABI31_0_0RNSVGUnits)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(gradientTransform, CGAffineTransform)

@end

/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI40_0_0RNSVGLinearGradientManager.h"
#import "ABI40_0_0RNSVGLinearGradient.h"

@implementation ABI40_0_0RNSVGLinearGradientManager

ABI40_0_0RCT_EXPORT_MODULE()

- (ABI40_0_0RNSVGNode *)node
{
  return [ABI40_0_0RNSVGLinearGradient new];
}

ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(x1, ABI40_0_0RNSVGLength*)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(y1, ABI40_0_0RNSVGLength*)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(x2, ABI40_0_0RNSVGLength*)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(y2, ABI40_0_0RNSVGLength*)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSArray<NSNumber *>)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(gradientUnits, ABI40_0_0RNSVGUnits)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(gradientTransform, CGAffineTransform)

@end

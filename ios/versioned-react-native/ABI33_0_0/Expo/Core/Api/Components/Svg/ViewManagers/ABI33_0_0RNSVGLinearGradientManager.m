/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI33_0_0RNSVGLinearGradientManager.h"
#import "ABI33_0_0RNSVGLinearGradient.h"

@implementation ABI33_0_0RNSVGLinearGradientManager

ABI33_0_0RCT_EXPORT_MODULE()

- (ABI33_0_0RNSVGNode *)node
{
  return [ABI33_0_0RNSVGLinearGradient new];
}

ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(x1, ABI33_0_0RNSVGLength*)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(y1, ABI33_0_0RNSVGLength*)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(x2, ABI33_0_0RNSVGLength*)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(y2, ABI33_0_0RNSVGLength*)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSArray<NSNumber *>)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(gradientUnits, ABI33_0_0RNSVGUnits)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(gradientTransform, CGAffineTransform)

@end

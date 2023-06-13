/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RNSVGLinearGradientManager.h"
#import "ABI47_0_0RNSVGLinearGradient.h"

@implementation ABI47_0_0RNSVGLinearGradientManager

ABI47_0_0RCT_EXPORT_MODULE()

- (ABI47_0_0RNSVGNode *)node
{
  return [ABI47_0_0RNSVGLinearGradient new];
}

ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(x1, ABI47_0_0RNSVGLength *)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(y1, ABI47_0_0RNSVGLength *)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(x2, ABI47_0_0RNSVGLength *)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(y2, ABI47_0_0RNSVGLength *)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSArray<NSNumber *>)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(gradientUnits, ABI47_0_0RNSVGUnits)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(gradientTransform, CGAffineTransform)

@end

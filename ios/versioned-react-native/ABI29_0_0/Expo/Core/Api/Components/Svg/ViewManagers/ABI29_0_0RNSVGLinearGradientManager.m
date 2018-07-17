/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI29_0_0RNSVGLinearGradientManager.h"
#import "ABI29_0_0RNSVGLinearGradient.h"

@implementation ABI29_0_0RNSVGLinearGradientManager

ABI29_0_0RCT_EXPORT_MODULE()

- (ABI29_0_0RNSVGNode *)node
{
  return [ABI29_0_0RNSVGLinearGradient new];
}

ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(x1, NSString)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(y1, NSString)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(x2, NSString)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(y2, NSString)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSArray<NSNumber *>)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(gradientUnits, ABI29_0_0RNSVGUnits)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(gradientTransform, CGAffineTransform)

@end

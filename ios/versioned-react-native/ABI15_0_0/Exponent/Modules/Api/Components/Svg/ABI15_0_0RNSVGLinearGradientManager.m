/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI15_0_0RNSVGLinearGradientManager.h"
#import "ABI15_0_0RNSVGLinearGradient.h"

@implementation ABI15_0_0RNSVGLinearGradientManager

ABI15_0_0RCT_EXPORT_MODULE()

- (ABI15_0_0RNSVGNode *)node
{
  return [ABI15_0_0RNSVGLinearGradient new];
}

ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(x1, NSString)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(y1, NSString)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(x2, NSString)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(y2, NSString)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSArray<NSNumber *>)

@end

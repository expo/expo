/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI10_0_0RNSVGEllipseManager.h"

#import "ABI10_0_0RNSVGEllipse.h"
#import "ABI10_0_0RCTConvert+RNSVG.h"

@implementation ABI10_0_0RNSVGEllipseManager

ABI10_0_0RCT_EXPORT_MODULE()

- (ABI10_0_0RNSVGRenderable *)node
{
  return [ABI10_0_0RNSVGEllipse new];
}

ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(cx, NSString)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(cy, NSString)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(rx, NSString)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(ry, NSString)

@end

/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI27_0_0RNSVGEllipseManager.h"

#import "ABI27_0_0RNSVGEllipse.h"
#import "ABI27_0_0RCTConvert+RNSVG.h"

@implementation ABI27_0_0RNSVGEllipseManager

ABI27_0_0RCT_EXPORT_MODULE()

- (ABI27_0_0RNSVGRenderable *)node
{
  return [ABI27_0_0RNSVGEllipse new];
}

ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(cx, NSString)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(cy, NSString)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(rx, NSString)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(ry, NSString)

@end

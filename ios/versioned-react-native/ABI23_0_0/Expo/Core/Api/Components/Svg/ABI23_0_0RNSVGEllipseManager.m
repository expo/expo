/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI23_0_0RNSVGEllipseManager.h"

#import "ABI23_0_0RNSVGEllipse.h"
#import "ABI23_0_0RCTConvert+RNSVG.h"

@implementation ABI23_0_0RNSVGEllipseManager

ABI23_0_0RCT_EXPORT_MODULE()

- (ABI23_0_0RNSVGRenderable *)node
{
  return [ABI23_0_0RNSVGEllipse new];
}

ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(cx, NSString)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(cy, NSString)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(rx, NSString)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(ry, NSString)

@end

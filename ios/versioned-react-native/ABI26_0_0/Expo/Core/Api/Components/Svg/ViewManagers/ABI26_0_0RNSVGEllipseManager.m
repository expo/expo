/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI26_0_0RNSVGEllipseManager.h"

#import "ABI26_0_0RNSVGEllipse.h"
#import "ABI26_0_0RCTConvert+RNSVG.h"

@implementation ABI26_0_0RNSVGEllipseManager

ABI26_0_0RCT_EXPORT_MODULE()

- (ABI26_0_0RNSVGRenderable *)node
{
  return [ABI26_0_0RNSVGEllipse new];
}

ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(cx, NSString)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(cy, NSString)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(rx, NSString)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(ry, NSString)

@end

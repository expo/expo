/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGRectManager.h"

#import "RNSVGRect.h"
#import "RCTConvert+RNSVG.h"

@implementation RNSVGRectManager

RCT_EXPORT_MODULE()

- (RNSVGRenderable *)node
{
  return [RNSVGRect new];
}

RCT_EXPORT_VIEW_PROPERTY(x, NSString)
RCT_EXPORT_VIEW_PROPERTY(y, NSString)
RCT_EXPORT_VIEW_PROPERTY(width, NSString)
RCT_EXPORT_VIEW_PROPERTY(height, NSString)
RCT_EXPORT_VIEW_PROPERTY(rx, NSString)
RCT_EXPORT_VIEW_PROPERTY(ry, NSString)

@end

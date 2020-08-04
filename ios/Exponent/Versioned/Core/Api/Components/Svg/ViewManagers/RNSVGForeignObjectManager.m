/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGForeignObjectManager.h"
#import "RNSVGForeignObject.h"

@implementation RNSVGForeignObjectManager

RCT_EXPORT_MODULE()

- (RNSVGForeignObject *)node
{
    return [RNSVGForeignObject new];
}

RCT_EXPORT_VIEW_PROPERTY(x, RNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(y, RNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(foreignObjectheight, RNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(foreignObjectwidth, RNSVGLength*)
RCT_CUSTOM_VIEW_PROPERTY(height, id, RNSVGForeignObject)
{
    view.foreignObjectheight = [RCTConvert RNSVGLength:json];
}
RCT_CUSTOM_VIEW_PROPERTY(width, id, RNSVGForeignObject)
{
    view.foreignObjectwidth = [RCTConvert RNSVGLength:json];
}

@end

/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGImageManager.h"
#import "RNSVGVBMOS.h"
#import "RNSVGImage.h"
#import "RCTConvert+RNSVG.h"

@implementation RNSVGImageManager

RCT_EXPORT_MODULE()

- (RNSVGRenderable *)node
{
    RNSVGImage *svgImage = [RNSVGImage new];
    svgImage.bridge = self.bridge;

    return svgImage;
}

RCT_EXPORT_VIEW_PROPERTY(x, RNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(y, RNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(imagewidth, RNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(imageheight, RNSVGLength*)
RCT_CUSTOM_VIEW_PROPERTY(width, id, RNSVGImage)
{
    view.imagewidth = [RCTConvert RNSVGLength:json];
}
RCT_CUSTOM_VIEW_PROPERTY(height, id, RNSVGImage)
{
    view.imageheight = [RCTConvert RNSVGLength:json];
}
RCT_EXPORT_VIEW_PROPERTY(src, id)
RCT_EXPORT_VIEW_PROPERTY(align, NSString)
RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, RNSVGVBMOS)

@end

/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI39_0_0RNSVGImageManager.h"
#import "ABI39_0_0RNSVGVBMOS.h"
#import "ABI39_0_0RNSVGImage.h"
#import "ABI39_0_0RCTConvert+RNSVG.h"

@implementation ABI39_0_0RNSVGImageManager

ABI39_0_0RCT_EXPORT_MODULE()

- (ABI39_0_0RNSVGRenderable *)node
{
    ABI39_0_0RNSVGImage *svgImage = [ABI39_0_0RNSVGImage new];
    svgImage.bridge = self.bridge;

    return svgImage;
}

ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI39_0_0RNSVGLength*)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI39_0_0RNSVGLength*)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(imagewidth, ABI39_0_0RNSVGLength*)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(imageheight, ABI39_0_0RNSVGLength*)
ABI39_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI39_0_0RNSVGImage)
{
    view.imagewidth = [ABI39_0_0RCTConvert ABI39_0_0RNSVGLength:json];
}
ABI39_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI39_0_0RNSVGImage)
{
    view.imageheight = [ABI39_0_0RCTConvert ABI39_0_0RNSVGLength:json];
}
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(src, id)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI39_0_0RNSVGVBMOS)

@end

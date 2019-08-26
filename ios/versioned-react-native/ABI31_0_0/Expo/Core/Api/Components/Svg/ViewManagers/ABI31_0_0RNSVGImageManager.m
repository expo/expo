/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0RNSVGImageManager.h"
#import "ABI31_0_0RNSVGVBMOS.h"
#import "ABI31_0_0RNSVGImage.h"
#import "ABI31_0_0RCTConvert+RNSVG.h"

@implementation ABI31_0_0RNSVGImageManager

ABI31_0_0RCT_EXPORT_MODULE()

- (ABI31_0_0RNSVGRenderable *)node
{
    ABI31_0_0RNSVGImage *svgImage = [ABI31_0_0RNSVGImage new];
    svgImage.bridge = self.bridge;

    return svgImage;
}

ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI31_0_0RNSVGLength*)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI31_0_0RNSVGLength*)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(imagewidth, ABI31_0_0RNSVGLength*)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(imageheight, ABI31_0_0RNSVGLength*)
ABI31_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI31_0_0RNSVGImage)
{
    view.imagewidth = [ABI31_0_0RCTConvert ABI31_0_0RNSVGLength:json];
}
ABI31_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI31_0_0RNSVGImage)
{
    view.imageheight = [ABI31_0_0RCTConvert ABI31_0_0RNSVGLength:json];
}
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(src, id)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI31_0_0RNSVGVBMOS)

@end

/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI40_0_0RNSVGImageManager.h"
#import "ABI40_0_0RNSVGVBMOS.h"
#import "ABI40_0_0RNSVGImage.h"
#import "ABI40_0_0RCTConvert+RNSVG.h"

@implementation ABI40_0_0RNSVGImageManager

ABI40_0_0RCT_EXPORT_MODULE()

- (ABI40_0_0RNSVGRenderable *)node
{
    ABI40_0_0RNSVGImage *svgImage = [ABI40_0_0RNSVGImage new];
    svgImage.bridge = self.bridge;

    return svgImage;
}

ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI40_0_0RNSVGLength*)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI40_0_0RNSVGLength*)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(imagewidth, ABI40_0_0RNSVGLength*)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(imageheight, ABI40_0_0RNSVGLength*)
ABI40_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI40_0_0RNSVGImage)
{
    view.imagewidth = [ABI40_0_0RCTConvert ABI40_0_0RNSVGLength:json];
}
ABI40_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI40_0_0RNSVGImage)
{
    view.imageheight = [ABI40_0_0RCTConvert ABI40_0_0RNSVGLength:json];
}
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(src, id)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI40_0_0RNSVGVBMOS)

@end

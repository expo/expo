/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI32_0_0RNSVGImageManager.h"
#import "ABI32_0_0RNSVGVBMOS.h"
#import "ABI32_0_0RNSVGImage.h"
#import "ABI32_0_0RCTConvert+RNSVG.h"

@implementation ABI32_0_0RNSVGImageManager

ABI32_0_0RCT_EXPORT_MODULE()

- (ABI32_0_0RNSVGRenderable *)node
{
    ABI32_0_0RNSVGImage *svgImage = [ABI32_0_0RNSVGImage new];
    svgImage.bridge = self.bridge;

    return svgImage;
}

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI32_0_0RNSVGLength*)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI32_0_0RNSVGLength*)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(imagewidth, ABI32_0_0RNSVGLength*)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(imageheight, ABI32_0_0RNSVGLength*)
ABI32_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI32_0_0RNSVGImage)
{
    view.imagewidth = [ABI32_0_0RCTConvert ABI32_0_0RNSVGLength:json];
}
ABI32_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI32_0_0RNSVGImage)
{
    view.imageheight = [ABI32_0_0RCTConvert ABI32_0_0RNSVGLength:json];
}
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(src, id)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI32_0_0RNSVGVBMOS)

@end

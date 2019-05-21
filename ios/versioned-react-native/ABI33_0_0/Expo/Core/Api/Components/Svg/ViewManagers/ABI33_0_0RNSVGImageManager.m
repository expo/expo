/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI33_0_0RNSVGImageManager.h"
#import "ABI33_0_0RNSVGVBMOS.h"
#import "ABI33_0_0RNSVGImage.h"
#import "ABI33_0_0RCTConvert+RNSVG.h"

@implementation ABI33_0_0RNSVGImageManager

ABI33_0_0RCT_EXPORT_MODULE()

- (ABI33_0_0RNSVGRenderable *)node
{
    ABI33_0_0RNSVGImage *svgImage = [ABI33_0_0RNSVGImage new];
    svgImage.bridge = self.bridge;

    return svgImage;
}

ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI33_0_0RNSVGLength*)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI33_0_0RNSVGLength*)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(imagewidth, ABI33_0_0RNSVGLength*)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(imageheight, ABI33_0_0RNSVGLength*)
ABI33_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI33_0_0RNSVGImage)
{
    view.imagewidth = [ABI33_0_0RCTConvert ABI33_0_0RNSVGLength:json];
}
ABI33_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI33_0_0RNSVGImage)
{
    view.imageheight = [ABI33_0_0RCTConvert ABI33_0_0RNSVGLength:json];
}
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(src, id)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI33_0_0RNSVGVBMOS)

@end

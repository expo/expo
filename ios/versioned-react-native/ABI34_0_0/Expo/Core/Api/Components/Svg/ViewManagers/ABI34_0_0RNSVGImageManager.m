/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI34_0_0RNSVGImageManager.h"
#import "ABI34_0_0RNSVGVBMOS.h"
#import "ABI34_0_0RNSVGImage.h"
#import "ABI34_0_0RCTConvert+RNSVG.h"

@implementation ABI34_0_0RNSVGImageManager

ABI34_0_0RCT_EXPORT_MODULE()

- (ABI34_0_0RNSVGRenderable *)node
{
    ABI34_0_0RNSVGImage *svgImage = [ABI34_0_0RNSVGImage new];
    svgImage.bridge = self.bridge;

    return svgImage;
}

ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI34_0_0RNSVGLength*)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI34_0_0RNSVGLength*)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(imagewidth, ABI34_0_0RNSVGLength*)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(imageheight, ABI34_0_0RNSVGLength*)
ABI34_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI34_0_0RNSVGImage)
{
    view.imagewidth = [ABI34_0_0RCTConvert ABI34_0_0RNSVGLength:json];
}
ABI34_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI34_0_0RNSVGImage)
{
    view.imageheight = [ABI34_0_0RCTConvert ABI34_0_0RNSVGLength:json];
}
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(src, id)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI34_0_0RNSVGVBMOS)

@end

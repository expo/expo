/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI41_0_0RNSVGImageManager.h"
#import "ABI41_0_0RNSVGVBMOS.h"
#import "ABI41_0_0RNSVGImage.h"
#import "ABI41_0_0RCTConvert+RNSVG.h"

@implementation ABI41_0_0RNSVGImageManager

ABI41_0_0RCT_EXPORT_MODULE()

- (ABI41_0_0RNSVGRenderable *)node
{
    ABI41_0_0RNSVGImage *svgImage = [ABI41_0_0RNSVGImage new];
    svgImage.bridge = self.bridge;

    return svgImage;
}

ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI41_0_0RNSVGLength*)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI41_0_0RNSVGLength*)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(imagewidth, ABI41_0_0RNSVGLength*)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(imageheight, ABI41_0_0RNSVGLength*)
ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI41_0_0RNSVGImage)
{
    view.imagewidth = [ABI41_0_0RCTConvert ABI41_0_0RNSVGLength:json];
}
ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI41_0_0RNSVGImage)
{
    view.imageheight = [ABI41_0_0RCTConvert ABI41_0_0RNSVGLength:json];
}
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(src, id)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI41_0_0RNSVGVBMOS)

@end

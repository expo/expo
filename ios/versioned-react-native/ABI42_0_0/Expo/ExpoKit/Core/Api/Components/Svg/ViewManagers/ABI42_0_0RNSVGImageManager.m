/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI42_0_0RNSVGImageManager.h"
#import "ABI42_0_0RNSVGVBMOS.h"
#import "ABI42_0_0RNSVGImage.h"
#import "ABI42_0_0RCTConvert+RNSVG.h"

@implementation ABI42_0_0RNSVGImageManager

ABI42_0_0RCT_EXPORT_MODULE()

- (ABI42_0_0RNSVGRenderable *)node
{
    ABI42_0_0RNSVGImage *svgImage = [ABI42_0_0RNSVGImage new];
    svgImage.bridge = self.bridge;

    return svgImage;
}

ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI42_0_0RNSVGLength*)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI42_0_0RNSVGLength*)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(imagewidth, ABI42_0_0RNSVGLength*)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(imageheight, ABI42_0_0RNSVGLength*)
ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI42_0_0RNSVGImage)
{
    view.imagewidth = [ABI42_0_0RCTConvert ABI42_0_0RNSVGLength:json];
}
ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI42_0_0RNSVGImage)
{
    view.imageheight = [ABI42_0_0RCTConvert ABI42_0_0RNSVGLength:json];
}
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(src, id)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI42_0_0RNSVGVBMOS)

@end

/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI45_0_0RNSVGImageManager.h"
#import "ABI45_0_0RNSVGVBMOS.h"
#import "ABI45_0_0RNSVGImage.h"
#import "ABI45_0_0RCTConvert+RNSVG.h"

@implementation ABI45_0_0RNSVGImageManager

ABI45_0_0RCT_EXPORT_MODULE()

- (ABI45_0_0RNSVGRenderable *)node
{
    ABI45_0_0RNSVGImage *svgImage = [ABI45_0_0RNSVGImage new];
    svgImage.bridge = self.bridge;

    return svgImage;
}

ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI45_0_0RNSVGLength*)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI45_0_0RNSVGLength*)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(imagewidth, ABI45_0_0RNSVGLength*)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(imageheight, ABI45_0_0RNSVGLength*)
ABI45_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI45_0_0RNSVGImage)
{
    view.imagewidth = [ABI45_0_0RCTConvert ABI45_0_0RNSVGLength:json];
}
ABI45_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI45_0_0RNSVGImage)
{
    view.imageheight = [ABI45_0_0RCTConvert ABI45_0_0RNSVGLength:json];
}
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(src, id)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI45_0_0RNSVGVBMOS)

@end

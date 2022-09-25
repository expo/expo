/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI46_0_0RNSVGImageManager.h"
#import "ABI46_0_0RNSVGVBMOS.h"
#import "ABI46_0_0RNSVGImage.h"
#import "ABI46_0_0RCTConvert+RNSVG.h"

@implementation ABI46_0_0RNSVGImageManager

ABI46_0_0RCT_EXPORT_MODULE()

- (ABI46_0_0RNSVGRenderable *)node
{
    ABI46_0_0RNSVGImage *svgImage = [ABI46_0_0RNSVGImage new];
    svgImage.bridge = self.bridge;

    return svgImage;
}

ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI46_0_0RNSVGLength*)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI46_0_0RNSVGLength*)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(imagewidth, ABI46_0_0RNSVGLength*)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(imageheight, ABI46_0_0RNSVGLength*)
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI46_0_0RNSVGImage)
{
    view.imagewidth = [ABI46_0_0RCTConvert ABI46_0_0RNSVGLength:json];
}
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI46_0_0RNSVGImage)
{
    view.imageheight = [ABI46_0_0RCTConvert ABI46_0_0RNSVGLength:json];
}
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(src, id)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI46_0_0RNSVGVBMOS)

@end

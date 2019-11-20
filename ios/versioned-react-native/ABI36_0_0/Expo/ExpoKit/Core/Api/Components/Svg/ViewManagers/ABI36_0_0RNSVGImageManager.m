/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI36_0_0RNSVGImageManager.h"
#import "ABI36_0_0RNSVGVBMOS.h"
#import "ABI36_0_0RNSVGImage.h"
#import "ABI36_0_0RCTConvert+RNSVG.h"

@implementation ABI36_0_0RNSVGImageManager

ABI36_0_0RCT_EXPORT_MODULE()

- (ABI36_0_0RNSVGRenderable *)node
{
    ABI36_0_0RNSVGImage *svgImage = [ABI36_0_0RNSVGImage new];
    svgImage.bridge = self.bridge;

    return svgImage;
}

ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI36_0_0RNSVGLength*)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI36_0_0RNSVGLength*)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(imagewidth, ABI36_0_0RNSVGLength*)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(imageheight, ABI36_0_0RNSVGLength*)
ABI36_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI36_0_0RNSVGImage)
{
    view.imagewidth = [ABI36_0_0RCTConvert ABI36_0_0RNSVGLength:json];
}
ABI36_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI36_0_0RNSVGImage)
{
    view.imageheight = [ABI36_0_0RCTConvert ABI36_0_0RNSVGLength:json];
}
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(src, id)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI36_0_0RNSVGVBMOS)

@end

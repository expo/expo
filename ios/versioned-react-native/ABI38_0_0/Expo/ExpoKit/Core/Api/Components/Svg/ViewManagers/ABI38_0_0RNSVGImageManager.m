/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI38_0_0RNSVGImageManager.h"
#import "ABI38_0_0RNSVGVBMOS.h"
#import "ABI38_0_0RNSVGImage.h"
#import "ABI38_0_0RCTConvert+RNSVG.h"

@implementation ABI38_0_0RNSVGImageManager

ABI38_0_0RCT_EXPORT_MODULE()

- (ABI38_0_0RNSVGRenderable *)node
{
    ABI38_0_0RNSVGImage *svgImage = [ABI38_0_0RNSVGImage new];
    svgImage.bridge = self.bridge;

    return svgImage;
}

ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI38_0_0RNSVGLength*)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI38_0_0RNSVGLength*)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(imagewidth, ABI38_0_0RNSVGLength*)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(imageheight, ABI38_0_0RNSVGLength*)
ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI38_0_0RNSVGImage)
{
    view.imagewidth = [ABI38_0_0RCTConvert ABI38_0_0RNSVGLength:json];
}
ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI38_0_0RNSVGImage)
{
    view.imageheight = [ABI38_0_0RCTConvert ABI38_0_0RNSVGLength:json];
}
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(src, id)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI38_0_0RNSVGVBMOS)

@end

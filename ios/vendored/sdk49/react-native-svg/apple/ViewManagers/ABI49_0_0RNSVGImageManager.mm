/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RNSVGImageManager.h"
#import "ABI49_0_0RCTConvert+RNSVG.h"
#import "ABI49_0_0RNSVGImage.h"
#import "ABI49_0_0RNSVGVBMOS.h"

@implementation ABI49_0_0RNSVGImageManager

ABI49_0_0RCT_EXPORT_MODULE()

- (ABI49_0_0RNSVGRenderable *)node
{
  ABI49_0_0RNSVGImage *svgImage = [ABI49_0_0RNSVGImage new];
  svgImage.bridge = self.bridge;

  return svgImage;
}

ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI49_0_0RNSVGLength *)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI49_0_0RNSVGLength *)
ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI49_0_0RNSVGImage)
{
  view.imagewidth = [ABI49_0_0RCTConvert ABI49_0_0RNSVGLength:json];
}
ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI49_0_0RNSVGImage)
{
  view.imageheight = [ABI49_0_0RCTConvert ABI49_0_0RNSVGLength:json];
}
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(src, ABI49_0_0RCTImageSource)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI49_0_0RNSVGVBMOS)

@end

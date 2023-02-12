/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RNSVGImageManager.h"
#import "ABI47_0_0RCTConvert+RNSVG.h"
#import "ABI47_0_0RNSVGImage.h"
#import "ABI47_0_0RNSVGVBMOS.h"

@implementation ABI47_0_0RNSVGImageManager

ABI47_0_0RCT_EXPORT_MODULE()

- (ABI47_0_0RNSVGRenderable *)node
{
  ABI47_0_0RNSVGImage *svgImage = [ABI47_0_0RNSVGImage new];
  svgImage.bridge = self.bridge;

  return svgImage;
}

ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(x, ABI47_0_0RNSVGLength *)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(y, ABI47_0_0RNSVGLength *)
ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(width, id, ABI47_0_0RNSVGImage)
{
  view.imagewidth = [ABI47_0_0RCTConvert ABI47_0_0RNSVGLength:json];
}
ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(height, id, ABI47_0_0RNSVGImage)
{
  view.imageheight = [ABI47_0_0RCTConvert ABI47_0_0RNSVGLength:json];
}
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(src, ABI47_0_0RCTImageSource)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(align, NSString)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(meetOrSlice, ABI47_0_0RNSVGVBMOS)

@end

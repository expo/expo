/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI40_0_0React/ABI40_0_0RCTGIFImageDecoder.h>

#import <ImageIO/ImageIO.h>
#import <QuartzCore/QuartzCore.h>
#import <ABI40_0_0React/ABI40_0_0RCTAnimatedImage.h>
#import <ABI40_0_0React/ABI40_0_0RCTUtils.h>
#import <ABI40_0_0ReactCommon/ABI40_0_0RCTTurboModule.h>

#import "ABI40_0_0RCTImagePlugins.h"

@interface ABI40_0_0RCTGIFImageDecoder() <ABI40_0_0RCTTurboModule>
@end

@implementation ABI40_0_0RCTGIFImageDecoder

ABI40_0_0RCT_EXPORT_MODULE()

- (BOOL)canDecodeImageData:(NSData *)imageData
{
  char header[7] = {};
  [imageData getBytes:header length:6];

  return !strcmp(header, "GIF87a") || !strcmp(header, "GIF89a");
}

- (ABI40_0_0RCTImageLoaderCancellationBlock)decodeImageData:(NSData *)imageData
                                              size:(CGSize)size
                                             scale:(CGFloat)scale
                                        resizeMode:(ABI40_0_0RCTResizeMode)resizeMode
                                 completionHandler:(ABI40_0_0RCTImageLoaderCompletionBlock)completionHandler
{
  ABI40_0_0RCTAnimatedImage *image = [[ABI40_0_0RCTAnimatedImage alloc] initWithData:imageData scale:scale];

  if (!image) {
    completionHandler(nil, nil);
    return ^{};
  }

  completionHandler(nil, image);
  return ^{};
}

@end

Class ABI40_0_0RCTGIFImageDecoderCls() {
  return ABI40_0_0RCTGIFImageDecoder.class;
}

/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI39_0_0React/ABI39_0_0RCTGIFImageDecoder.h>

#import <ImageIO/ImageIO.h>
#import <QuartzCore/QuartzCore.h>
#import <ABI39_0_0React/ABI39_0_0RCTAnimatedImage.h>
#import <ABI39_0_0React/ABI39_0_0RCTUtils.h>
#import <ABI39_0_0ReactCommon/ABI39_0_0RCTTurboModule.h>

#import "ABI39_0_0RCTImagePlugins.h"

@interface ABI39_0_0RCTGIFImageDecoder() <ABI39_0_0RCTTurboModule>
@end

@implementation ABI39_0_0RCTGIFImageDecoder

ABI39_0_0RCT_EXPORT_MODULE()

- (BOOL)canDecodeImageData:(NSData *)imageData
{
  char header[7] = {};
  [imageData getBytes:header length:6];

  return !strcmp(header, "GIF87a") || !strcmp(header, "GIF89a");
}

- (ABI39_0_0RCTImageLoaderCancellationBlock)decodeImageData:(NSData *)imageData
                                              size:(CGSize)size
                                             scale:(CGFloat)scale
                                        resizeMode:(ABI39_0_0RCTResizeMode)resizeMode
                                 completionHandler:(ABI39_0_0RCTImageLoaderCompletionBlock)completionHandler
{
  ABI39_0_0RCTAnimatedImage *image = [[ABI39_0_0RCTAnimatedImage alloc] initWithData:imageData scale:scale];

  if (!image) {
    completionHandler(nil, nil);
    return ^{};
  }

  completionHandler(nil, image);
  return ^{};
}

@end

Class ABI39_0_0RCTGIFImageDecoderCls() {
  return ABI39_0_0RCTGIFImageDecoder.class;
}

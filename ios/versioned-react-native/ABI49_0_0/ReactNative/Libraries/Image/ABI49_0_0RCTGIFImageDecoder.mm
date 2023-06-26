/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI49_0_0React/ABI49_0_0RCTGIFImageDecoder.h>

#import <ImageIO/ImageIO.h>
#import <QuartzCore/QuartzCore.h>
#import <ABI49_0_0React/ABI49_0_0RCTAnimatedImage.h>
#import <ABI49_0_0React/ABI49_0_0RCTUtils.h>
#import <ABI49_0_0ReactCommon/ABI49_0_0RCTTurboModule.h>

#import "ABI49_0_0RCTImagePlugins.h"

@interface ABI49_0_0RCTGIFImageDecoder () <ABI49_0_0RCTTurboModule>
@end

@implementation ABI49_0_0RCTGIFImageDecoder

ABI49_0_0RCT_EXPORT_MODULE()

- (BOOL)canDecodeImageData:(NSData *)imageData
{
  char header[7] = {};
  [imageData getBytes:header length:6];

  return !strcmp(header, "GIF87a") || !strcmp(header, "GIF89a");
}

- (ABI49_0_0RCTImageLoaderCancellationBlock)decodeImageData:(NSData *)imageData
                                              size:(CGSize)size
                                             scale:(CGFloat)scale
                                        resizeMode:(ABI49_0_0RCTResizeMode)resizeMode
                                 completionHandler:(ABI49_0_0RCTImageLoaderCompletionBlock)completionHandler
{
  ABI49_0_0RCTAnimatedImage *image = [[ABI49_0_0RCTAnimatedImage alloc] initWithData:imageData scale:scale];

  if (!image) {
    completionHandler(nil, nil);
    return ^{
    };
  }

  completionHandler(nil, image);
  return ^{
  };
}

- (std::shared_ptr<ABI49_0_0facebook::ABI49_0_0React::TurboModule>)getTurboModule:
    (const ABI49_0_0facebook::ABI49_0_0React::ObjCTurboModule::InitParams &)params
{
  return nullptr;
}

@end

Class ABI49_0_0RCTGIFImageDecoderCls()
{
  return ABI49_0_0RCTGIFImageDecoder.class;
}

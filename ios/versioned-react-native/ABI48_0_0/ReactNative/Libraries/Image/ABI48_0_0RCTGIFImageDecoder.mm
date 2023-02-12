/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI48_0_0React/ABI48_0_0RCTGIFImageDecoder.h>

#import <ImageIO/ImageIO.h>
#import <QuartzCore/QuartzCore.h>
#import <ABI48_0_0React/ABI48_0_0RCTAnimatedImage.h>
#import <ABI48_0_0React/ABI48_0_0RCTUtils.h>
#import <ABI48_0_0ReactCommon/ABI48_0_0RCTTurboModule.h>

#import "ABI48_0_0RCTImagePlugins.h"

@interface ABI48_0_0RCTGIFImageDecoder () <ABI48_0_0RCTTurboModule>
@end

@implementation ABI48_0_0RCTGIFImageDecoder

ABI48_0_0RCT_EXPORT_MODULE()

- (BOOL)canDecodeImageData:(NSData *)imageData
{
  char header[7] = {};
  [imageData getBytes:header length:6];

  return !strcmp(header, "GIF87a") || !strcmp(header, "GIF89a");
}

- (ABI48_0_0RCTImageLoaderCancellationBlock)decodeImageData:(NSData *)imageData
                                              size:(CGSize)size
                                             scale:(CGFloat)scale
                                        resizeMode:(ABI48_0_0RCTResizeMode)resizeMode
                                 completionHandler:(ABI48_0_0RCTImageLoaderCompletionBlock)completionHandler
{
  ABI48_0_0RCTAnimatedImage *image = [[ABI48_0_0RCTAnimatedImage alloc] initWithData:imageData scale:scale];

  if (!image) {
    completionHandler(nil, nil);
    return ^{
    };
  }

  completionHandler(nil, image);
  return ^{
  };
}

- (std::shared_ptr<ABI48_0_0facebook::ABI48_0_0React::TurboModule>)getTurboModule:
    (const ABI48_0_0facebook::ABI48_0_0React::ObjCTurboModule::InitParams &)params
{
  return nullptr;
}

@end

Class ABI48_0_0RCTGIFImageDecoderCls()
{
  return ABI48_0_0RCTGIFImageDecoder.class;
}

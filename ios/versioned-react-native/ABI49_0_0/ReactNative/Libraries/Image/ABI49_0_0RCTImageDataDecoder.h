/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI49_0_0React/ABI49_0_0RCTBridge.h>
#import <ABI49_0_0React/ABI49_0_0RCTImageURLLoader.h>
#import <ABI49_0_0React/ABI49_0_0RCTResizeMode.h>
#import <ABI49_0_0React/ABI49_0_0RCTURLRequestHandler.h>

/**
 * Provides the interface needed to register an image decoder. Image decoders
 * are also bridge modules, so should be registered using ABI49_0_0RCT_EXPORT_MODULE().
 */
@protocol ABI49_0_0RCTImageDataDecoder <ABI49_0_0RCTBridgeModule>

/**
 * Indicates whether this handler is capable of decoding the specified data.
 * Typically the handler would examine some sort of header data to determine
 * this.
 */
- (BOOL)canDecodeImageData:(NSData *)imageData;

/**
 * Decode an image from the data object. The method should call the
 * completionHandler when the decoding operation  has finished. The method
 * should also return a cancellation block, if applicable.
 *
 * If you provide a custom image decoder, you most implement scheduling yourself,
 * to avoid decoding large amounts of images at the same time.
 */
- (ABI49_0_0RCTImageLoaderCancellationBlock)decodeImageData:(NSData *)imageData
                                              size:(CGSize)size
                                             scale:(CGFloat)scale
                                        resizeMode:(ABI49_0_0RCTResizeMode)resizeMode
                                 completionHandler:(ABI49_0_0RCTImageLoaderCompletionBlock)completionHandler;

@optional

/**
 * If more than one ABI49_0_0RCTImageDataDecoder responds YES to `-canDecodeImageData:`
 * then `decoderPriority` is used to determine which one to use. The decoder
 * with the highest priority will be selected. Default priority is zero.
 * If two or more valid decoders have the same priority, the selection order is
 * undefined.
 */
- (float)decoderPriority;

@end

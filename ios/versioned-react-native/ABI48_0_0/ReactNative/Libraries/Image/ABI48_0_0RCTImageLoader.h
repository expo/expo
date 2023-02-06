/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI48_0_0React/ABI48_0_0RCTBridge.h>
#import <ABI48_0_0React/ABI48_0_0RCTDefines.h>
#import <ABI48_0_0React/ABI48_0_0RCTImageCache.h>
#import <ABI48_0_0React/ABI48_0_0RCTImageDataDecoder.h>
#import <ABI48_0_0React/ABI48_0_0RCTImageLoaderLoggable.h>
#import <ABI48_0_0React/ABI48_0_0RCTImageLoaderProtocol.h>
#import <ABI48_0_0React/ABI48_0_0RCTImageURLLoader.h>
#import <ABI48_0_0React/ABI48_0_0RCTResizeMode.h>
#import <ABI48_0_0React/ABI48_0_0RCTURLRequestHandler.h>

@interface ABI48_0_0RCTImageLoader : NSObject <ABI48_0_0RCTBridgeModule, ABI48_0_0RCTImageLoaderProtocol, ABI48_0_0RCTImageLoaderLoggableProtocol>
- (instancetype)init;
- (instancetype)initWithRedirectDelegate:(id<ABI48_0_0RCTImageRedirectProtocol>)redirectDelegate NS_DESIGNATED_INITIALIZER;
- (instancetype)initWithRedirectDelegate:(id<ABI48_0_0RCTImageRedirectProtocol>)redirectDelegate
                         loadersProvider:(NSArray<id<ABI48_0_0RCTImageURLLoader>> * (^)(ABI48_0_0RCTModuleRegistry *))getLoaders
                        decodersProvider:(NSArray<id<ABI48_0_0RCTImageDataDecoder>> * (^)(ABI48_0_0RCTModuleRegistry *))getDecoders;
@end

/**
 * DEPRECATED!! DO NOT USE
 * Instead use `[_bridge moduleForClass:[ABI48_0_0RCTImageLoader class]]`
 */
@interface ABI48_0_0RCTBridge (ABI48_0_0RCTImageLoader)

@property (nonatomic, readonly) ABI48_0_0RCTImageLoader *imageLoader;

@end

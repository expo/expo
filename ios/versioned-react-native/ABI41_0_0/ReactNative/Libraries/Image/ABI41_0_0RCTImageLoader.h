/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI41_0_0React/ABI41_0_0RCTBridge.h>
#import <ABI41_0_0React/ABI41_0_0RCTDefines.h>
#import <ABI41_0_0React/ABI41_0_0RCTResizeMode.h>
#import <ABI41_0_0React/ABI41_0_0RCTURLRequestHandler.h>
#import <ABI41_0_0React/ABI41_0_0RCTImageDataDecoder.h>
#import <ABI41_0_0React/ABI41_0_0RCTImageURLLoader.h>
#import <ABI41_0_0React/ABI41_0_0RCTImageCache.h>
#import <ABI41_0_0React/ABI41_0_0RCTImageLoaderProtocol.h>

@interface ABI41_0_0RCTImageLoader : NSObject <ABI41_0_0RCTBridgeModule, ABI41_0_0RCTImageLoaderProtocol>
- (instancetype)init;
- (instancetype)initWithRedirectDelegate:(id<ABI41_0_0RCTImageRedirectProtocol>)redirectDelegate NS_DESIGNATED_INITIALIZER;
- (instancetype)initWithRedirectDelegate:(id<ABI41_0_0RCTImageRedirectProtocol>)redirectDelegate
                              loadersProvider:(NSArray<id<ABI41_0_0RCTImageURLLoader>> * (^)(void))getLoaders
                             decodersProvider:(NSArray<id<ABI41_0_0RCTImageDataDecoder>> * (^)(void))getDecoders;
@end

/**
 * DEPRECATED!! DO NOT USE
 * Instead use `[_bridge moduleForClass:[ABI41_0_0RCTImageLoader class]]`
 */
@interface ABI41_0_0RCTBridge (ABI41_0_0RCTImageLoader)

@property (nonatomic, readonly) ABI41_0_0RCTImageLoader *imageLoader;

@end

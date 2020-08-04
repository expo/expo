/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI38_0_0React/ABI38_0_0RCTBridge.h>
#import <ABI38_0_0React/ABI38_0_0RCTDefines.h>
#import <ABI38_0_0React/ABI38_0_0RCTResizeMode.h>
#import <ABI38_0_0React/ABI38_0_0RCTURLRequestHandler.h>
#import <ABI38_0_0React/ABI38_0_0RCTImageDataDecoder.h>
#import <ABI38_0_0React/ABI38_0_0RCTImageURLLoader.h>
#import <ABI38_0_0React/ABI38_0_0RCTImageCache.h>
#import <ABI38_0_0React/ABI38_0_0RCTImageLoaderProtocol.h>

ABI38_0_0RCT_EXTERN BOOL ABI38_0_0RCTImageLoadingInstrumentationEnabled(void);
ABI38_0_0RCT_EXTERN BOOL ABI38_0_0RCTImageLoadingPerfInstrumentationEnabled(void);
ABI38_0_0RCT_EXTERN void ABI38_0_0RCTEnableImageLoadingInstrumentation(BOOL enabled);
ABI38_0_0RCT_EXTERN void ABI38_0_0RCTEnableImageLoadingPerfInstrumentation(BOOL enabled);

@interface ABI38_0_0RCTImageLoader : NSObject <ABI38_0_0RCTBridgeModule, ABI38_0_0RCTImageLoaderProtocol>
- (instancetype)init;
- (instancetype)initWithRedirectDelegate:(id<ABI38_0_0RCTImageRedirectProtocol>)redirectDelegate NS_DESIGNATED_INITIALIZER;
- (instancetype)initWithRedirectDelegate:(id<ABI38_0_0RCTImageRedirectProtocol>)redirectDelegate
                              loadersProvider:(NSArray<id<ABI38_0_0RCTImageURLLoader>> * (^)(void))getLoaders
                             decodersProvider:(NSArray<id<ABI38_0_0RCTImageDataDecoder>> * (^)(void))getDecoders;
@end

/**
 * DEPRECATED!! DO NOT USE
 * Instead use `[_bridge moduleForClass:[ABI38_0_0RCTImageLoader class]]`
 */
@interface ABI38_0_0RCTBridge (ABI38_0_0RCTImageLoader)

@property (nonatomic, readonly) ABI38_0_0RCTImageLoader *imageLoader;

@end

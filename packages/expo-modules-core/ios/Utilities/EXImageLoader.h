// Copyright 2025-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXImageLoaderInterface.h>

#if !__building_module(ExpoModulesCore)
#import <React/RCTBridge.h>
#import <React/RCTImageLoader.h>
#else
@class RCTBridge;
@class RCTImageLoader;
#endif

NS_SWIFT_NAME(ImageLoader)
@interface EXImageLoader : NSObject <EXImageLoaderInterface>

- (nonnull instancetype)initWithBridge:(nonnull RCTBridge *)bridge;

- (nonnull instancetype)initWithRCTImageLoader:(nonnull RCTImageLoader *)loader;

@end

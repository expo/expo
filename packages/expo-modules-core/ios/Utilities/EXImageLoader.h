// Copyright 2025-present 650 Industries. All rights reserved.

#if !__building_module(ExpoModulesCore)
#import <React/RCTBridge.h>
#import <React/RCTImageLoader.h>
#import <ExpoModulesCore/EXImageLoaderInterface.h>
#else
@class RCTBridge;
@class RCTImageLoader;
@protocol EXImageLoaderInterface;
#endif

NS_SWIFT_NAME(ImageLoader)
@interface EXImageLoader : NSObject <EXImageLoaderInterface>

- (nonnull instancetype)initWithBridge:(nonnull RCTBridge *)bridge;

- (nonnull instancetype)initWithRCTImageLoader:(nonnull RCTImageLoader *)loader;

@end

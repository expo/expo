// Copyright 2025-present 650 Industries. All rights reserved.

#import <React/RCTBridge.h>
#import <React/RCTImageLoader.h>
#import <ExpoModulesCore/EXImageLoaderInterface.h>

NS_SWIFT_NAME(ImageLoader)
@interface EXImageLoader : NSObject <EXImageLoaderInterface>

- (nonnull instancetype)initWithBridge:(nonnull RCTBridge *)bridge;

- (nonnull instancetype)initWithRCTImageLoader:(nonnull RCTImageLoader *)loader;

@end

// Copyright 2025-present 650 Industries. All rights reserved.

#if !__building_module(ExpoModulesCore)
#import <React/RCTBridge.h>
#else
@class RCTBridge;
#endif

#import <ExpoModulesCore/EXImageLoaderInterface.h>

NS_SWIFT_NAME(ImageLoader)
@interface EXImageLoader : NSObject <EXImageLoaderInterface>

- (nonnull instancetype)initWithBridge:(nonnull RCTBridge *)bridge;

@end

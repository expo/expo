// Copyright 2025-present 650 Industries. All rights reserved.

#if __building_module(ExpoModulesCore) || __building_module(ExpoModulesCoreObjC)
@class RCTBridge;
@class RCTImageLoader;
@protocol EXImageLoaderInterface;
#else
#import <React/RCTBridge.h>
#import <React/RCTImageLoader.h>
#import <ExpoModulesCore/EXImageLoaderInterface.h>
#endif

NS_SWIFT_NAME(ImageLoader)
@interface EXImageLoader : NSObject <EXImageLoaderInterface>

- (nonnull instancetype)initWithBridge:(nonnull RCTBridge *)bridge;

- (nonnull instancetype)initWithRCTImageLoader:(nonnull RCTImageLoader *)loader;

/**
 Wraps `module` if it's an `RCTImageLoader`, or returns `nil` otherwise. Lives
 in ObjC so the Swift side doesn't need to name the `RCTImageLoader` type and
 thus doesn't drag `React` into the `ExpoModulesCore.swiftmodule` dep graph.
 */
+ (nullable instancetype)imageLoaderForReactModule:(nullable id)module;

@end

// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXAbstractLoader.h"

@protocol EXHomeAppLoaderTaskDelegate;

NS_ASSUME_NONNULL_BEGIN

/**
 Subclass of EXAbstractLoader, specifically for loading the home app in development (published dev home or locally running home bundler).
 */
@interface EXDevelopmentHomeLoader : EXAbstractLoader <EXHomeAppLoaderTaskDelegate>

- (instancetype)init NS_DESIGNATED_INITIALIZER;
- (instancetype)initWithManifestUrl:(NSURL *)url NS_UNAVAILABLE;
- (instancetype)initWithLocalManifest:(EXManifestsManifest *)manifest NS_UNAVAILABLE;

@end

NS_ASSUME_NONNULL_END

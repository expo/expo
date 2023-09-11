// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXAbstractLoader.h"

@class EXManifestAndAssetRequestHeaders;

@protocol EXHomeAppLoaderTaskDelegate;

NS_ASSUME_NONNULL_BEGIN

/**
 Subclass of EXAbstractLoader, specifically for loading the home app.
 */
@interface EXHomeLoader : EXAbstractLoader <EXHomeAppLoaderTaskDelegate>

- (instancetype)initWithManifestAndAssetRequestHeaders:(EXManifestAndAssetRequestHeaders *)manifestAndAssetRequestHeaders;
- (instancetype)initWithManifestUrl:(NSURL *)url NS_UNAVAILABLE;
- (instancetype)initWithLocalManifest:(EXManifestsManifest *)manifest NS_UNAVAILABLE;

@end

NS_ASSUME_NONNULL_END

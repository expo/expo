// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXAbstractLoader.h"

@class EXManifestAndAssetRequestHeaders;

NS_ASSUME_NONNULL_BEGIN

FOUNDATION_EXPORT NSString *kEXHomeBundleResourceName;

/**
 Subclass of EXAbstractLoader, specifically for loading the embedded home app bundle and manifest in production.
 */
@interface EXEmbeddedHomeLoader : EXAbstractLoader

- (instancetype)init NS_DESIGNATED_INITIALIZER;
- (instancetype)initWithManifestUrl:(NSURL *)url NS_UNAVAILABLE;
- (instancetype)initWithLocalManifest:(EXManifestsManifest *)manifest NS_UNAVAILABLE;

@end

NS_ASSUME_NONNULL_END

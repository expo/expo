// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXAbstractLoader.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXHomeStubLoader : EXAbstractLoader

- (instancetype)init NS_DESIGNATED_INITIALIZER;
- (instancetype)initWithManifestUrl:(NSURL *)url NS_UNAVAILABLE;
- (instancetype)initWithLocalManifest:(EXManifestsManifest *)manifest NS_UNAVAILABLE;

@end

NS_ASSUME_NONNULL_END

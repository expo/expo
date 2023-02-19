// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXAppFetcher+Private.h"

@class EXManifestsManifest;

NS_ASSUME_NONNULL_BEGIN

@interface EXAppFetcherCacheOnly : EXAppFetcher

- (instancetype)initWithAppLoader:(EXAbstractLoader *)appLoader manifest:(EXManifestsManifest *)manifest;

@end

NS_ASSUME_NONNULL_END

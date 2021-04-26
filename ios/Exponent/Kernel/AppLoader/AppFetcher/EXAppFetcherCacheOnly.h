// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXAppFetcher+Private.h"
#import <EXUpdates/EXUpdatesRawManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXAppFetcherCacheOnly : EXAppFetcher

- (instancetype)initWithAppLoader:(EXAppLoader *)appLoader manifest:(EXUpdatesRawManifest *)manifest;

@end

NS_ASSUME_NONNULL_END

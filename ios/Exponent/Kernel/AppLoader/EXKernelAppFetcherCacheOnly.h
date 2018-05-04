// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXKernelAppFetcher+Private.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXKernelAppFetcherCacheOnly : EXKernelAppFetcher

- (instancetype)initWithAppLoader:(EXKernelAppLoader *)appLoader manifest:(NSDictionary *)manifest;

@end

NS_ASSUME_NONNULL_END

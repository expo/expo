// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXAppFetcher+Private.h"

@class EXManifestsManifest;

NS_ASSUME_NONNULL_BEGIN

@protocol EXAppFetcherWithTimeoutDelegate <NSObject>

- (void)appFetcher:(EXAppFetcher *)appFetcher didResolveUpdatedBundleWithManifest:(EXManifestsManifest * _Nullable)manifest isFromCache:(BOOL)isFromCache error:(NSError * _Nullable)error;

@end

@interface EXAppFetcherWithTimeout : EXAppFetcher

@property (nonatomic, weak) id<EXAppFetcherWithTimeoutDelegate> withTimeoutDelegate;

- (instancetype)initWithAppLoader:(EXAbstractLoader *)appLoader timeout:(NSTimeInterval)timeout;

@end

NS_ASSUME_NONNULL_END

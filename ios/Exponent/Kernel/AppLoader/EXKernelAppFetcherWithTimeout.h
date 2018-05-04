// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXKernelAppFetcher+Private.h"

NS_ASSUME_NONNULL_BEGIN

@protocol EXKernelAppFetcherWithTimeoutDelegate <NSObject>

- (void)appFetcher:(EXKernelAppFetcher *)appFetcher didResolveUpdatedBundleWithManifest:(NSDictionary * _Nullable)manifest isFromCache:(BOOL)isFromCache error:(NSError * _Nullable)error;

@end

@interface EXKernelAppFetcherWithTimeout : EXKernelAppFetcher

@property (nonatomic, weak) id<EXKernelAppFetcherWithTimeoutDelegate> withTimeoutDelegate;

- (instancetype)initWithAppLoader:(EXKernelAppLoader *)appLoader timeoutLengthInMs:(NSUInteger)timeoutLengthInMs;

@end

NS_ASSUME_NONNULL_END

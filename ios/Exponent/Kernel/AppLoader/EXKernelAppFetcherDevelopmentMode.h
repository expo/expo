// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXKernelAppFetcher+Private.h"

NS_ASSUME_NONNULL_BEGIN

@protocol EXKernelAppFetcherDevelopmentModeDelegate <NSObject>

- (void)appFetcher:(EXKernelAppFetcher *)appFetcher didLoadBundleWithProgress:(EXLoadingProgress *)progress;

@end

@interface EXKernelAppFetcherDevelopmentMode : EXKernelAppFetcher

@property (nonatomic, weak) id<EXKernelAppFetcherDevelopmentModeDelegate> developmentModeDelegate;

- (instancetype)initWithAppLoader:(EXKernelAppLoader *)appLoader manifest:(NSDictionary *)manifest;

- (void)forceBundleReload;

@end

NS_ASSUME_NONNULL_END

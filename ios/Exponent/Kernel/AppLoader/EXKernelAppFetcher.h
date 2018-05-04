// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import "EXResourceLoader.h"

@class EXKernelAppLoader;
@class EXKernelAppFetcher;

NS_ASSUME_NONNULL_BEGIN

@protocol EXKernelAppFetcherDelegate <NSObject>

- (void)appFetcher:(EXKernelAppFetcher *)appFetcher didSwitchToAppFetcher:(EXKernelAppFetcher *)newAppFetcher;

- (void)appFetcher:(EXKernelAppFetcher *)appFetcher didLoadOptimisticManifest:(NSDictionary *)manifest;
- (void)appFetcher:(EXKernelAppFetcher *)appFetcher didFinishLoadingManifest:(NSDictionary *)manifest bundle:(NSData *)bundle;
- (void)appFetcher:(EXKernelAppFetcher *)appFetcher didFailWithError:(NSError *)error;

@end

@protocol EXKernelAppFetcherDataSource <NSObject>

- (NSString *)bundleResourceNameForAppFetcher:(EXKernelAppFetcher *)appFetcher withManifest:(NSDictionary *)manifest;
- (BOOL)appFetcherShouldInvalidateBundleCache:(EXKernelAppFetcher *)appFetcher;

@end

@protocol EXKernelAppFetcherCacheDataSource <NSObject>

- (BOOL)isCacheUpToDateWithAppFetcher:(EXKernelAppFetcher *)appFetcher;

@end

@interface EXKernelAppFetcher : NSObject

@property (nonatomic, readonly) NSDictionary * _Nullable manifest;
@property (nonatomic, readonly) NSData * _Nullable bundle;
@property (nonatomic, readonly) NSError * _Nullable error;

@property (nonatomic, weak) id<EXKernelAppFetcherDelegate> delegate;
@property (nonatomic, weak) id<EXKernelAppFetcherDataSource> dataSource;
@property (nonatomic, weak) id<EXKernelAppFetcherCacheDataSource> cacheDataSource;

- (instancetype)initWithAppLoader:(EXKernelAppLoader *)appLoader;
- (void)start;

- (void)fetchJSBundleWithManifest:(NSDictionary *)manifest
                    cacheBehavior:(EXCachedResourceBehavior)cacheBehavior
                  timeoutInterval:(NSTimeInterval)timeoutInterval
                         progress:(void (^ _Nullable )(EXLoadingProgress *))progressBlock
                          success:(void (^)(NSData *))successBlock
                            error:(void (^)(NSError *))errorBlock;

+ (NSString *)experienceIdWithManifest:(NSDictionary *)manifest;
+ (BOOL)areDevToolsEnabledWithManifest:(NSDictionary *)manifest;
+ (EXCachedResourceBehavior)cacheBehaviorForJSWithManifest:(NSDictionary *)manifest;

@end

NS_ASSUME_NONNULL_END

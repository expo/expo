// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import "EXResourceLoader.h"

@class EXAbstractLoader;
@class EXAppFetcher;
@class EXManifestsManifest;

NS_ASSUME_NONNULL_BEGIN

@protocol EXAppFetcherDelegate <NSObject>

/**
 *  If the delegate guessed incorrectly about which subclass of AppFetcher to use,
 *  this method should be called so that the new AppFetcher can be set up properly.
 *
 *  Use retainingCurrent:YES only if the current (calling) AppFetcher is still doing work
 *  (e.g. fetching an update in the background) and should not be immediately deallocated.
 */
- (void)appFetcher:(EXAppFetcher *)appFetcher didSwitchToAppFetcher:(EXAppFetcher *)newAppFetcher retainingCurrent:(BOOL)shouldRetain;

- (void)appFetcher:(EXAppFetcher *)appFetcher didLoadOptimisticManifest:(EXManifestsManifest *)manifest;
- (void)appFetcher:(EXAppFetcher *)appFetcher didFinishLoadingManifest:(EXManifestsManifest *)manifest bundle:(NSData *)bundle;
- (void)appFetcher:(EXAppFetcher *)appFetcher didFailWithError:(NSError *)error;

@end

@protocol EXAppFetcherDataSource <NSObject>

- (NSString *)bundleResourceNameForAppFetcher:(EXAppFetcher *)appFetcher withManifest:(EXManifestsManifest *)manifest;
- (BOOL)appFetcherShouldInvalidateBundleCache:(EXAppFetcher *)appFetcher;

@end

@protocol EXAppFetcherCacheDataSource <NSObject>

- (BOOL)isCacheUpToDateWithAppFetcher:(EXAppFetcher *)appFetcher;

@end

@interface EXAppFetcher : NSObject

@property (nonatomic, readonly) EXManifestsManifest * _Nullable manifest;
@property (nonatomic, readonly) NSData * _Nullable bundle;
@property (nonatomic, readonly) NSError * _Nullable error;

@property (nonatomic, weak) id<EXAppFetcherDelegate> delegate;
@property (nonatomic, weak) id<EXAppFetcherDataSource> dataSource;
@property (nonatomic, weak) id<EXAppFetcherCacheDataSource> cacheDataSource;

- (instancetype)initWithAppLoader:(EXAbstractLoader *)appLoader;
- (void)start;

- (void)fetchJSBundleWithManifest:(EXManifestsManifest *)manifest
                    cacheBehavior:(EXCachedResourceBehavior)cacheBehavior
                  timeoutInterval:(NSTimeInterval)timeoutInterval
                         progress:(void (^ _Nullable )(EXLoadingProgress *))progressBlock
                          success:(void (^)(NSData *))successBlock
                            error:(void (^)(NSError *))errorBlock;

+ (EXCachedResourceBehavior)cacheBehaviorForJSWithManifest:(EXManifestsManifest *)manifest;

@end

NS_ASSUME_NONNULL_END

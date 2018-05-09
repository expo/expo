// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import "EXCachedResource.h"
#import "EXAppFetcher.h"
#import "EXAppFetcherDevelopmentMode.h"
#import "EXAppFetcherWithTimeout.h"

@class EXKernelAppRecord;
@class EXAppLoader;

NS_ASSUME_NONNULL_BEGIN

FOUNDATION_EXPORT NSTimeInterval const kEXAppLoaderDefaultTimeout;
FOUNDATION_EXPORT NSTimeInterval const kEXJSBundleTimeout;

typedef enum EXAppLoaderStatus {
  kEXAppLoaderStatusNew,
  kEXAppLoaderStatusHasManifest, // possibly optimistic
  kEXAppLoaderStatusHasManifestAndBundle,
  kEXAppLoaderStatusError,
} EXAppLoaderStatus;

@protocol EXAppLoaderDelegate <NSObject>

- (void)appLoader:(EXAppLoader *)appLoader didLoadOptimisticManifest:(NSDictionary *)manifest;
- (void)appLoader:(EXAppLoader *)appLoader didLoadBundleWithProgress:(EXLoadingProgress *)progress;
- (void)appLoader:(EXAppLoader *)appLoader didFinishLoadingManifest:(NSDictionary *)manifest bundle:(NSData *)data;
- (void)appLoader:(EXAppLoader *)appLoader didFailWithError:(NSError *)error;
- (void)appLoader:(EXAppLoader *)appLoader didResolveUpdatedBundleWithManifest:(NSDictionary * _Nullable)manifest isFromCache:(BOOL)isFromCache error:(NSError * _Nullable)error;

@end

@interface EXAppLoader : NSObject <EXAppFetcherDelegate, EXAppFetcherDevelopmentModeDelegate, EXAppFetcherWithTimeoutDelegate, EXAppFetcherCacheDataSource>

@property (nonatomic, readonly) NSURL *manifestUrl;
@property (nonatomic, readonly) NSDictionary * _Nullable manifest; // possibly optimistic
@property (nonatomic, readonly) NSData * _Nullable bundle;
@property (nonatomic, readonly) EXAppLoaderStatus status;

@property (nonatomic, weak) id<EXAppLoaderDelegate> delegate;
@property (nonatomic, weak) id<EXAppFetcherDataSource> dataSource;

- (instancetype)initWithManifestUrl:(NSURL *)url;
- (instancetype)initWithLocalManifest:(NSDictionary * _Nonnull)manifest;

/**
 *  Begin a new request.
 *  In production, this will fetch a manifest and a bundle using the caching behavior specified by the Updates API.
 *  If the manifest enables developer tools, this will stop after it gets a manifest, and wait for `forceBundleReload`.
 */
- (void)request;

/**
 *  Begin a new request, but only use the most recently cached manifest.
 *  In production, this will fetch a manifest and a bundle using the caching behavior specified by the Updates API.
 *  If the manifest enables developer tools, this will stop after it gets a manifest, and wait for `forceBundleReload`.
 */
- (void)requestFromCache;

/**
 *  Reset status to `kEXAppLoaderStatusHasManifest` and fetch the bundle at the existing
 *  manifest. This is called when RN devtools reload an AppManager/RCTBridge directly
 *  via reload, live reload, etc.
 *
 *  This will throw if not supported, i.e. if `supportsBundleReload` returns false.
 */
- (void)forceBundleReload;

/**
 *  Return whether this AppLoader supports directly reloading the bundle. Right now the only case
 *  where that's possible is if we're running an app in dev mode.
 */
- (BOOL)supportsBundleReload;

/**
 * Fetch manifest without any side effects or interaction with the timer.
 */
- (void)fetchManifestWithCacheBehavior:(EXCachedResourceBehavior)cacheBehavior success:(void (^)(NSDictionary *))success failure:(void (^)(NSError *))failure;

@end

NS_ASSUME_NONNULL_END

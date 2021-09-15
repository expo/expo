// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import "EXAppFetcher.h"
#import "EXAppFetcherDevelopmentMode.h"
#import "EXAppFetcherWithTimeout.h"
#import "EXCachedResource.h"
#import <EXManifests/EXManifestsManifest.h>

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

typedef enum EXAppLoaderRemoteUpdateStatus {
  kEXAppLoaderRemoteUpdateStatusChecking,
  kEXAppLoaderRemoteUpdateStatusDownloading
} EXAppLoaderRemoteUpdateStatus;

@protocol EXAppLoaderDelegate <NSObject>

- (void)appLoader:(EXAppLoader *)appLoader didLoadOptimisticManifest:(EXManifestsManifest *)manifest;
- (void)appLoader:(EXAppLoader *)appLoader didLoadBundleWithProgress:(EXLoadingProgress *)progress;
- (void)appLoader:(EXAppLoader *)appLoader didFinishLoadingManifest:(EXManifestsManifest *)manifest bundle:(NSData *)data;
- (void)appLoader:(EXAppLoader *)appLoader didFailWithError:(NSError *)error;
- (void)appLoader:(EXAppLoader *)appLoader didResolveUpdatedBundleWithManifest:(EXManifestsManifest * _Nullable)manifest isFromCache:(BOOL)isFromCache error:(NSError * _Nullable)error;

@end

@interface EXAppLoader : NSObject <EXAppFetcherDelegate, EXAppFetcherDevelopmentModeDelegate, EXAppFetcherWithTimeoutDelegate, EXAppFetcherCacheDataSource>

@property (nonatomic, readonly) NSURL *manifestUrl;
@property (nonatomic, readonly) EXManifestsManifest * _Nullable manifest; // possibly optimistic
@property (nonatomic, readonly) EXManifestsManifest * _Nullable cachedManifest; // we definitely have this manifest and its bundle on the device
@property (nonatomic, readonly) NSData * _Nullable bundle;
@property (nonatomic, readonly) EXAppLoaderStatus status;
@property (nonatomic, readonly) EXAppLoaderRemoteUpdateStatus remoteUpdateStatus;
@property (nonatomic, readonly) BOOL shouldShowRemoteUpdateStatus;
@property (nonatomic, readonly) BOOL isUpToDate;

@property (nonatomic, weak) id<EXAppLoaderDelegate> delegate;
@property (nonatomic, weak) id<EXAppFetcherDataSource> dataSource;

- (instancetype)initWithManifestUrl:(NSURL *)url;
- (instancetype)initWithLocalManifest:(EXManifestsManifest * _Nonnull)manifest;

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
 *  Tell this AppLoader that everything has finished successfully and its manifest resource can be cached.
 */
- (void)writeManifestToCache;

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
- (void)fetchManifestWithCacheBehavior:(EXManifestCacheBehavior)cacheBehavior success:(void (^)(EXManifestsManifest *))success failure:(void (^)(NSError *))failure;

@end

NS_ASSUME_NONNULL_END

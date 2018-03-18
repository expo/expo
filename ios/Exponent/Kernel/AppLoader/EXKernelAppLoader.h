// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import "EXCachedResource.h"

@class EXKernelAppRecord;
@class EXKernelAppLoader;

NS_ASSUME_NONNULL_BEGIN

FOUNDATION_EXPORT NSTimeInterval const kEXJSBundleTimeout;

typedef enum EXKernelAppLoaderStatus {
  kEXKernelAppLoaderStatusNew,
  kEXKernelAppLoaderStatusHasManifest, // possibly optimistic
  kEXKernelAppLoaderStatusHasManifestAndBundle,
  kEXKernelAppLoaderStatusError,
} EXKernelAppLoaderStatus;

@protocol EXKernelAppLoaderDataSource <NSObject>

- (NSString *)bundleResourceNameForAppLoader:(EXKernelAppLoader *)appLoader;
- (BOOL)appLoaderShouldInvalidateBundleCache:(EXKernelAppLoader *)appLoader;

@end

@protocol EXKernelAppLoaderDelegate <NSObject>

- (void)appLoader:(EXKernelAppLoader *)appLoader didLoadOptimisticManifest:(NSDictionary *)manifest;
- (void)appLoader:(EXKernelAppLoader *)appLoader didLoadBundleWithProgress:(EXLoadingProgress *)progress;
- (void)appLoader:(EXKernelAppLoader *)appLoader didFinishLoadingManifest:(NSDictionary *)manifest bundle:(NSData *)data;
- (void)appLoader:(EXKernelAppLoader *)appLoader didFailWithError:(NSError *)error;
- (void)appLoader:(EXKernelAppLoader *)appLoader didResolveUpdatedBundleWithManifest:(NSDictionary * _Nullable)manifest isFromCache:(BOOL)isFromCache error:(NSError * _Nullable)error;

@end

@interface EXKernelAppLoader : NSObject

@property (nonatomic, readonly) NSURL *manifestUrl;
@property (nonatomic, readonly) NSDictionary * _Nullable manifest; // possibly optimistic
@property (nonatomic, readonly) NSData * _Nullable bundle;
@property (nonatomic, readonly) EXKernelAppLoaderStatus status;

@property (nonatomic, weak) id<EXKernelAppLoaderDelegate> delegate;
@property (nonatomic, weak) id<EXKernelAppLoaderDataSource> dataSource;

- (instancetype)initWithManifestUrl:(NSURL *)url;
- (instancetype)initWithLocalManifest:(NSDictionary * _Nonnull)manifest;

/**
 *  Begin a new request.
 *  In production, this will fetch a manifest and a bundle using the caching behavior specified by the Updates API.
 *  If the manifest enables developer tools, this will stop after it gets a manifest, and wait for `forceBundleReload`.
 */
- (void)request;

/**
 *  Reset status to `kEXKernelAppLoaderStatusHasManifest` and fetch the bundle at the existing
 *  manifest. This is called when RN devtools reload an AppManager/RCTBridge directly
 *  via reload, live reload, etc.
 */
- (void)forceBundleReload;

@end

NS_ASSUME_NONNULL_END

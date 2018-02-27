// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import "EXCachedResource.h"

@class EXKernelAppRecord;
@class EXKernelAppLoader;

NS_ASSUME_NONNULL_BEGIN

typedef enum EXKernelAppLoaderStatus {
  kEXKernelAppLoaderStatusNew,
  kEXKernelAppLoaderStatusHasManifest, // possibly optimistic
  kEXKernelAppLoaderStatusHasManifestAndBundle,
  kEXKernelAppLoaderStatusError,
} EXKernelAppLoaderStatus;

@protocol EXKernelAppLoaderDelegate <NSObject>

- (void)appLoader:(EXKernelAppLoader *)appLoader didLoadOptimisticManifest:(NSDictionary *)manifest;
- (void)appLoader:(EXKernelAppLoader *)appLoader didLoadBundleWithProgress:(EXLoadingProgress *)progress;
- (void)appLoader:(EXKernelAppLoader *)appLoader didFinishLoadingManifest:(NSDictionary *)manifest bundle:(NSData *)data;
- (void)appLoader:(EXKernelAppLoader *)appLoader didFailWithError:(NSError *)error;

@end

@interface EXKernelAppLoader : NSObject

@property (nonatomic, readonly) NSURL *manifestUrl;
@property (nonatomic, readonly) NSDictionary * _Nullable manifest; // possibly optimistic
@property (nonatomic, readonly) NSData * _Nullable bundle;
@property (nonatomic, readonly) EXKernelAppLoaderStatus status;
@property (nonatomic, assign) id<EXKernelAppLoaderDelegate> delegate;

- (instancetype)initWithManifestUrl:(NSURL *)url;
- (instancetype)initWithLocalManifest:(NSDictionary * _Nonnull)manifest;
- (void)request;

@end

NS_ASSUME_NONNULL_END

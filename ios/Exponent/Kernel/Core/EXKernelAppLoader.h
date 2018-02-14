// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import "EXCachedResource.h"

@class EXKernelAppRecord;
@class EXKernelAppLoader;

NS_ASSUME_NONNULL_BEGIN

@protocol EXKernelBundleLoaderDelegate <NSObject>

- (void)appLoader:(EXKernelAppLoader *)appLoader didLoadBundleWithProgress:(EXLoadingProgress *)progress;
- (void)appLoader:(EXKernelAppLoader *)appLoader didFinishLoadingBundle:(NSData *)data;
- (void)appLoader:(EXKernelAppLoader *)appLoader didFailLoadingBundleWithError:(NSError *)error;

@end

@interface EXKernelAppLoader : NSObject

@property (nonatomic, readonly, strong) NSDictionary * _Nullable manifest;
@property (nonatomic, readonly, assign) BOOL bundleFinished;

- (instancetype)initWithManifestUrl:(NSURL *)url;
- (void)requestManifestWithHttpUrl:(NSURL *)url success:(void (^)(NSDictionary *))success failure:(void (^)(NSError *))failure;
- (void)requestJSBundleWithDelegate:(id<EXKernelBundleLoaderDelegate>)delegate;

@end

NS_ASSUME_NONNULL_END

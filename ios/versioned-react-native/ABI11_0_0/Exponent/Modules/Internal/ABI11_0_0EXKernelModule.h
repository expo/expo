// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI11_0_0RCTEventEmitter.h"

@class ABI11_0_0EXKernelModule;

@protocol ABI11_0_0EXKernelModuleDelegate <NSObject>

- (void)kernelModuleDidSelectDevMenu: (ABI11_0_0EXKernelModule *)module;
- (void)kernelModule: (ABI11_0_0EXKernelModule *)module taskDidForegroundWithType: (NSInteger)type params: (NSDictionary *)params;
- (void)kernelModule:(ABI11_0_0EXKernelModule *)module
didRequestManifestWithUrl:(NSURL *)url
         originalUrl:(NSURL *)originalUrl
             success:(void (^)(NSString *manifestString))success
             failure:(void (^)(NSError *err))failure;

@end

@interface ABI11_0_0EXKernelModule : ABI11_0_0RCTEventEmitter

@property (nonatomic, assign) id<ABI11_0_0EXKernelModuleDelegate> delegate;

- (instancetype)initWithVersions: (NSArray *)supportedSdkVersions;
- (void)dispatchJSEvent: (NSString *)eventName
                   body: (NSDictionary *)eventBody
              onSuccess: (void (^)(NSDictionary *))success
              onFailure: (void (^)(NSString *))failure;

@end

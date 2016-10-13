// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI10_0_0RCTEventEmitter.h"

@class ABI10_0_0EXKernelModule;

@protocol ABI10_0_0EXKernelModuleDelegate <NSObject>

- (void)kernelModuleDidSelectDevMenu: (ABI10_0_0EXKernelModule *)module;
- (void)kernelModule: (ABI10_0_0EXKernelModule *)module taskDidForegroundWithType: (NSInteger)type params: (NSDictionary *)params;
- (void)kernelModule:(ABI10_0_0EXKernelModule *)module
didRequestManifestWithUrl:(NSURL *)url
         originalUrl:(NSURL *)originalUrl
             success:(void (^)(NSString *manifestString))success
             failure:(void (^)(NSError *err))failure;

@end

@interface ABI10_0_0EXKernelModule : ABI10_0_0RCTEventEmitter

@property (nonatomic, assign) id<ABI10_0_0EXKernelModuleDelegate> delegate;

- (instancetype)initWithVersions: (NSArray *)supportedSdkVersions;
- (void)dispatchJSEvent: (NSString *)eventName
                   body: (NSDictionary *)eventBody
              onSuccess: (void (^)(NSDictionary *))success
              onFailure: (void (^)(NSString *))failure;

@end

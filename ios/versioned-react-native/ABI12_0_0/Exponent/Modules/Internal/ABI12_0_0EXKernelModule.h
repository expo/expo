// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI12_0_0RCTEventEmitter.h"

@class ABI12_0_0EXKernelModule;

@protocol ABI12_0_0EXKernelModuleDelegate <NSObject>

- (void)kernelModuleDidSelectDevMenu: (ABI12_0_0EXKernelModule *)module;
- (void)kernelModule: (ABI12_0_0EXKernelModule *)module taskDidForegroundWithType: (NSInteger)type params: (NSDictionary *)params;
- (void)kernelModule:(ABI12_0_0EXKernelModule *)module
didRequestManifestWithUrl:(NSURL *)url
         originalUrl:(NSURL *)originalUrl
             success:(void (^)(NSString *manifestString))success
             failure:(void (^)(NSError *err))failure;

@end

@interface ABI12_0_0EXKernelModule : ABI12_0_0RCTEventEmitter

@property (nonatomic, assign) id<ABI12_0_0EXKernelModuleDelegate> delegate;

- (instancetype)initWithVersions: (NSArray *)supportedSdkVersions;
- (void)dispatchJSEvent: (NSString *)eventName
                   body: (NSDictionary *)eventBody
              onSuccess: (void (^)(NSDictionary *))success
              onFailure: (void (^)(NSString *))failure;

@end

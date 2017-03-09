// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI15_0_0/ABI15_0_0RCTEventEmitter.h>

@class ABI15_0_0EXKernelModule;

@protocol ABI15_0_0EXKernelModuleDelegate <NSObject>

- (void)kernelModuleDidSelectDevMenu: (ABI15_0_0EXKernelModule *)module;
- (void)kernelModule: (ABI15_0_0EXKernelModule *)module taskDidForegroundWithType: (NSInteger)type params: (NSDictionary *)params;
- (void)kernelModule:(ABI15_0_0EXKernelModule *)module
didRequestManifestWithUrl:(NSURL *)url
         originalUrl:(NSURL *)originalUrl
             success:(void (^)(NSString *manifestString))success
             failure:(void (^)(NSError *err))failure;

@end

@interface ABI15_0_0EXKernelModule : ABI15_0_0RCTEventEmitter

@property (nonatomic, assign) id<ABI15_0_0EXKernelModuleDelegate> delegate;

- (instancetype)initWithVersions: (NSArray *)supportedSdkVersions;
- (void)dispatchJSEvent: (NSString *)eventName
                   body: (NSDictionary *)eventBody
              onSuccess: (void (^)(NSDictionary *))success
              onFailure: (void (^)(NSString *))failure;

@end

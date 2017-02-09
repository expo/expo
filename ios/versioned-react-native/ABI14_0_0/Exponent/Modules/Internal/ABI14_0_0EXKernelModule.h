// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI14_0_0/ABI14_0_0RCTEventEmitter.h>

@class ABI14_0_0EXKernelModule;

@protocol ABI14_0_0EXKernelModuleDelegate <NSObject>

- (void)kernelModuleDidSelectDevMenu: (ABI14_0_0EXKernelModule *)module;
- (void)kernelModule: (ABI14_0_0EXKernelModule *)module taskDidForegroundWithType: (NSInteger)type params: (NSDictionary *)params;
- (void)kernelModule:(ABI14_0_0EXKernelModule *)module
didRequestManifestWithUrl:(NSURL *)url
         originalUrl:(NSURL *)originalUrl
             success:(void (^)(NSString *manifestString))success
             failure:(void (^)(NSError *err))failure;

@end

@interface ABI14_0_0EXKernelModule : ABI14_0_0RCTEventEmitter

@property (nonatomic, assign) id<ABI14_0_0EXKernelModuleDelegate> delegate;

- (instancetype)initWithVersions: (NSArray *)supportedSdkVersions;
- (void)dispatchJSEvent: (NSString *)eventName
                   body: (NSDictionary *)eventBody
              onSuccess: (void (^)(NSDictionary *))success
              onFailure: (void (^)(NSString *))failure;

@end

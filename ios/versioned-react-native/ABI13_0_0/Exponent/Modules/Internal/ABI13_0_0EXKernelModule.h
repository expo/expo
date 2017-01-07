// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI13_0_0/ABI13_0_0RCTEventEmitter.h>

@class ABI13_0_0EXKernelModule;

@protocol ABI13_0_0EXKernelModuleDelegate <NSObject>

- (void)kernelModuleDidSelectDevMenu: (ABI13_0_0EXKernelModule *)module;
- (void)kernelModule: (ABI13_0_0EXKernelModule *)module taskDidForegroundWithType: (NSInteger)type params: (NSDictionary *)params;
- (void)kernelModule:(ABI13_0_0EXKernelModule *)module
didRequestManifestWithUrl:(NSURL *)url
         originalUrl:(NSURL *)originalUrl
             success:(void (^)(NSString *manifestString))success
             failure:(void (^)(NSError *err))failure;

@end

@interface ABI13_0_0EXKernelModule : ABI13_0_0RCTEventEmitter

@property (nonatomic, assign) id<ABI13_0_0EXKernelModuleDelegate> delegate;

- (instancetype)initWithVersions: (NSArray *)supportedSdkVersions;
- (void)dispatchJSEvent: (NSString *)eventName
                   body: (NSDictionary *)eventBody
              onSuccess: (void (^)(NSDictionary *))success
              onFailure: (void (^)(NSString *))failure;

@end

// Copyright 2015-present 650 Industries. All rights reserved.

#import "RCTEventEmitter.h"

FOUNDATION_EXPORT NSString * const kEXKernelJSIsLoadedNotification;

@class EXKernelModule;

@protocol EXKernelModuleDelegate <NSObject>

- (void)kernelModuleDidSelectDevMenu: (EXKernelModule *)module;
- (void)kernelModule: (EXKernelModule *)module taskDidForegroundWithType: (NSInteger)type params: (NSDictionary *)params;

@end

@interface EXKernelModule : RCTEventEmitter

@property (nonatomic, assign) id<EXKernelModuleDelegate> delegate;

- (void)dispatchJSEvent: (NSString *)eventName
                   body: (NSDictionary *)eventBody
              onSuccess: (void (^)(NSDictionary *))success
              onFailure: (void (^)(NSString *))failure;

@end

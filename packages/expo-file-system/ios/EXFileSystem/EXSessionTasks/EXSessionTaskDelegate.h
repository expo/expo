// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UMCore/UMDefines.h>

@protocol EXSessionRegister <NSObject>

- (void)unregister:(NSURLSession *)session;
- (void)unregister:(NSURLSession *)session uuid:(NSString *)uuid;

@end

@interface EXSessionTaskDelegate : NSObject <NSURLSessionTaskDelegate>

@property (nonatomic, strong, readonly) UMPromiseResolveBlock resolve;
@property (nonatomic, strong, readonly) UMPromiseRejectBlock reject;
@property (nonatomic, strong, readonly) id<EXSessionRegister> sessionRegister;

- (instancetype)initWithSessionRegister:(id<EXSessionRegister>)sessionRegister
                                resolve:(UMPromiseResolveBlock)resolve
                                 reject:(UMPromiseRejectBlock)reject;

- (NSMutableDictionary *)parseServerResponse:(NSURLResponse *)response;

@end


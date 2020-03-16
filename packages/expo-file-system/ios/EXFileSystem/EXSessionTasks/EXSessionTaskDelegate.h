// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UMCore/UMDefines.h>

@class EXSessionTaskDelegate;

typedef void (^EXTaskCompleted)(EXSessionTaskDelegate *task);

@protocol EXSessionTaskRegister <NSObject>

- (void)onSessionCompleted:(NSURLSession *)session;

@end

@interface EXSessionTaskDelegate : NSObject <NSURLSessionTaskDelegate>

@property (nonatomic, strong) NSString *uuid;
@property (nonatomic, strong) UMPromiseResolveBlock resolve;
@property (nonatomic, strong) UMPromiseRejectBlock reject;
@property (nonatomic, weak) id<EXSessionTaskRegister> taskRegister;

- (instancetype)initWithResolve:(UMPromiseResolveBlock)resolve
                     withReject:(UMPromiseRejectBlock)reject
        withSessionTaskRegister:(id<EXSessionTaskRegister>)taskRegister;

- (NSMutableDictionary *)parseServerResponse:(NSURLResponse *)response;

@end


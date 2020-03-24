// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UMCore/UMDefines.h>

@class EXSessionTaskDelegate;

@interface EXSessionTaskDelegate : NSObject <NSURLSessionTaskDelegate>

@property (nonatomic, strong) NSString *uuid;
@property (nonatomic, strong) UMPromiseResolveBlock resolve;
@property (nonatomic, strong) UMPromiseRejectBlock reject;

- (instancetype)initWithResolve:(UMPromiseResolveBlock)resolve
                         reject:(UMPromiseRejectBlock)reject;

- (NSMutableDictionary *)parseServerResponse:(NSURLResponse *)response;

@end


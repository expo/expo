// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXFileSystem/EXSessionTaskDelegate.h>
#import <EXFileSystem/EXSessionHandler.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXSessionTaskDispatcher : NSObject <NSURLSessionDelegate>

- (void)registerTaskDelegate:(EXSessionTaskDelegate *)delegate forTask:(NSURLSessionTask *)task;

- (void)deactivate;

- (instancetype)initWithSessionHandler:(id<EXSessionHandler>)sessionHandler;

@end

NS_ASSUME_NONNULL_END

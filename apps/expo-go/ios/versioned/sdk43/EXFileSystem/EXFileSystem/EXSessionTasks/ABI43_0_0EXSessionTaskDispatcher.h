// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI43_0_0EXFileSystem/ABI43_0_0EXSessionTaskDelegate.h>
#import <ABI43_0_0EXFileSystem/ABI43_0_0EXSessionHandler.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI43_0_0EXSessionTaskDispatcher : NSObject <NSURLSessionDelegate>

- (instancetype)initWithSessionHandler:(id<ABI43_0_0EXSessionHandler>)sessionHandler;

- (void)registerTaskDelegate:(ABI43_0_0EXSessionTaskDelegate *)delegate forTask:(NSURLSessionTask *)task;

- (void)deactivate;

@end

NS_ASSUME_NONNULL_END

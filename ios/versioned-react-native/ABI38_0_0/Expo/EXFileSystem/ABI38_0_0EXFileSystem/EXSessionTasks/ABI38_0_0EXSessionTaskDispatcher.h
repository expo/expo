// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI38_0_0EXFileSystem/ABI38_0_0EXSessionTaskDelegate.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI38_0_0EXSessionTaskDispatcher : NSObject <NSURLSessionDelegate>

- (void)registerTaskDelegate:(ABI38_0_0EXSessionTaskDelegate *)delegate forTask:(NSURLSessionTask *)task;

- (void)deactivate;

@end

NS_ASSUME_NONNULL_END

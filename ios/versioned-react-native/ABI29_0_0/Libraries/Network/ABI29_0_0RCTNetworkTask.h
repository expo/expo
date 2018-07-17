/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ReactABI29_0_0/ABI29_0_0RCTURLRequestDelegate.h>
#import <ReactABI29_0_0/ABI29_0_0RCTURLRequestHandler.h>

typedef void (^ABI29_0_0RCTURLRequestCompletionBlock)(NSURLResponse *response, NSData *data, NSError *error);
typedef void (^ABI29_0_0RCTURLRequestCancellationBlock)(void);
typedef void (^ABI29_0_0RCTURLRequestIncrementalDataBlock)(NSData *data, int64_t progress, int64_t total);
typedef void (^ABI29_0_0RCTURLRequestProgressBlock)(int64_t progress, int64_t total);
typedef void (^ABI29_0_0RCTURLRequestResponseBlock)(NSURLResponse *response);

typedef NS_ENUM(NSInteger, ABI29_0_0RCTNetworkTaskStatus) {
  ABI29_0_0RCTNetworkTaskPending = 0,
  ABI29_0_0RCTNetworkTaskInProgress,
  ABI29_0_0RCTNetworkTaskFinished,
};

@interface ABI29_0_0RCTNetworkTask : NSObject <ABI29_0_0RCTURLRequestDelegate>

@property (nonatomic, readonly) NSURLRequest *request;
@property (nonatomic, readonly) NSNumber *requestID;
@property (nonatomic, readonly, weak) id requestToken;
@property (nonatomic, readonly) NSURLResponse *response;

@property (nonatomic, copy) ABI29_0_0RCTURLRequestCompletionBlock completionBlock;
@property (nonatomic, copy) ABI29_0_0RCTURLRequestProgressBlock downloadProgressBlock;
@property (nonatomic, copy) ABI29_0_0RCTURLRequestIncrementalDataBlock incrementalDataBlock;
@property (nonatomic, copy) ABI29_0_0RCTURLRequestResponseBlock responseBlock;
@property (nonatomic, copy) ABI29_0_0RCTURLRequestProgressBlock uploadProgressBlock;

@property (nonatomic, readonly) ABI29_0_0RCTNetworkTaskStatus status;

- (instancetype)initWithRequest:(NSURLRequest *)request
                        handler:(id<ABI29_0_0RCTURLRequestHandler>)handler
                  callbackQueue:(dispatch_queue_t)callbackQueue NS_DESIGNATED_INITIALIZER;

- (void)start;
- (void)cancel;

@end

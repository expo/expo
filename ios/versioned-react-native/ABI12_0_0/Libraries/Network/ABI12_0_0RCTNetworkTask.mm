/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI12_0_0RCTNetworkTask.h"

#import <mutex>

#import "ABI12_0_0RCTLog.h"
#import "ABI12_0_0RCTUtils.h"

@implementation ABI12_0_0RCTNetworkTask
{
  NSMutableData *_data;
  id<ABI12_0_0RCTURLRequestHandler> _handler;
  dispatch_queue_t _callbackQueue;

  ABI12_0_0RCTNetworkTask *_selfReference;
  std::mutex _mutex;
}

@synthesize status = _status;

- (instancetype)initWithRequest:(NSURLRequest *)request
                        handler:(id<ABI12_0_0RCTURLRequestHandler>)handler
                  callbackQueue:(dispatch_queue_t)callbackQueue
{
  ABI12_0_0RCTAssertParam(request);
  ABI12_0_0RCTAssertParam(handler);
  ABI12_0_0RCTAssertParam(callbackQueue);

  static NSUInteger requestID = 0;

  if ((self = [super init])) {
    _requestID = @(requestID++);
    _request = request;
    _handler = handler;
    _callbackQueue = callbackQueue;
    _status = ABI12_0_0RCTNetworkTaskPending;

    dispatch_queue_set_specific(callbackQueue, (__bridge void *)self, (__bridge void *)self, NULL);
  }
  return self;
}

ABI12_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (void)invalidate
{
  _selfReference = nil;
  _completionBlock = nil;
  _downloadProgressBlock = nil;
  _incrementalDataBlock = nil;
  _responseBlock = nil;
  _uploadProgressBlock = nil;
  _requestToken = nil;
}

- (ABI12_0_0RCTNetworkTaskStatus)status
{
  std::lock_guard<std::mutex> lock(_mutex);
  return _status;
}

- (void)dispatchCallback:(dispatch_block_t)callback
{
  if (dispatch_get_specific((__bridge void *)self) == (__bridge void *)self) {
    callback();
  } else {
    dispatch_async(_callbackQueue, callback);
  }
}

- (BOOL)start
{
  std::lock_guard<std::mutex> lock(_mutex);
  if (_status != ABI12_0_0RCTNetworkTaskPending) {
    ABI12_0_0RCTLogError(@"Can't start task that's not pending");
    return NO;
  }

  ABI12_0_0RCTAssert(_requestToken == nil, @"requestToken should not be set before the task is started");
  _selfReference = self;
  _status = ABI12_0_0RCTNetworkTaskInProgress;

  dispatch_block_t sendRequestBlock = ^{
    self->_requestToken = [self->_handler sendRequest:self->_request withDelegate:self];
  };

  if ([_handler respondsToSelector:@selector(methodQueue)]) {
    dispatch_async([_handler methodQueue], sendRequestBlock);
  } else {
    sendRequestBlock();
  }

  return YES;
}

- (void)cancel
{
  std::lock_guard<std::mutex> lock(_mutex);
  if (_status == ABI12_0_0RCTNetworkTaskFinished) {
    return;
  }

  id token = _requestToken;
  if (token && [_handler respondsToSelector:@selector(cancelRequest:)]) {
    [_handler cancelRequest:token];
  }

  // The task was in progress, we'll get a completion callback anyway
  if (_status != ABI12_0_0RCTNetworkTaskInProgress) {
    [self invalidate];
  }

  _status = ABI12_0_0RCTNetworkTaskFinished;
}

- (BOOL)validateRequestToken:(id)requestToken
{
  if (_requestToken == nil) {
    if (ABI12_0_0RCT_DEBUG) {
      ABI12_0_0RCTLogError(@"Missing request token for request: %@", _request);
    }
    return NO;
  }

  if (![requestToken isEqual:_requestToken]) {
    if (ABI12_0_0RCT_DEBUG) {
      ABI12_0_0RCTLogError(@"Unrecognized request token: %@ expected: %@", requestToken, _requestToken);
    }

    std::lock_guard<std::mutex> lock(_mutex);
    _status = ABI12_0_0RCTNetworkTaskFinished;
    if (_completionBlock) {
      ABI12_0_0RCTURLRequestCompletionBlock completionBlock = _completionBlock;
      [self dispatchCallback:^{
        completionBlock(self->_response, nil, ABI12_0_0RCTErrorWithMessage(@"Invalid request token."));
      }];
    }

    [self invalidate];
  }

  return YES;
}

- (void)URLRequest:(id)requestToken didSendDataWithProgress:(int64_t)bytesSent
{
  if (![self validateRequestToken:requestToken]) {
    return;
  }

  if (_uploadProgressBlock) {
    ABI12_0_0RCTURLRequestProgressBlock uploadProgressBlock = _uploadProgressBlock;
    int64_t length = _request.HTTPBody.length;
    [self dispatchCallback:^{
      uploadProgressBlock(bytesSent, length);
    }];
  }
}

- (void)URLRequest:(id)requestToken didReceiveResponse:(NSURLResponse *)response
{
  if (![self validateRequestToken:requestToken]) {
    return;
  }

  _response = response;
  if (_responseBlock) {
    ABI12_0_0RCTURLRequestResponseBlock responseBlock = _responseBlock;
    [self dispatchCallback:^{
      responseBlock(response);
    }];
  }
}

- (void)URLRequest:(id)requestToken didReceiveData:(NSData *)data
{
  if (![self validateRequestToken:requestToken]) {
    return;
  }

  if (!_data) {
    _data = [NSMutableData new];
  }
  [_data appendData:data];

  int64_t length = _data.length;
  int64_t total = _response.expectedContentLength;

  if (_incrementalDataBlock) {
    ABI12_0_0RCTURLRequestIncrementalDataBlock incrementalDataBlock = _incrementalDataBlock;
    [self dispatchCallback:^{
      incrementalDataBlock(data, length, total);
    }];
  }
  if (_downloadProgressBlock && total > 0) {
    ABI12_0_0RCTURLRequestProgressBlock downloadProgressBlock = _downloadProgressBlock;
    [self dispatchCallback:^{
      downloadProgressBlock(length, total);
    }];
  }
}

- (void)URLRequest:(id)requestToken didCompleteWithError:(NSError *)error
{
  if (![self validateRequestToken:requestToken]) {
    return;
  }

  std::lock_guard<std::mutex> lock(_mutex);
  _status = ABI12_0_0RCTNetworkTaskFinished;
  if (_completionBlock) {
    ABI12_0_0RCTURLRequestCompletionBlock completionBlock = _completionBlock;
    [self dispatchCallback:^{
      completionBlock(self->_response, self->_data, error);
    }];
  }

  [self invalidate];
}

@end

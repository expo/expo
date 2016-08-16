/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI5_0_0RCTNetworkTask.h"

#import "ABI5_0_0RCTLog.h"

@implementation ABI5_0_0RCTNetworkTask
{
  NSMutableData *_data;
  id<ABI5_0_0RCTURLRequestHandler> _handler;
  ABI5_0_0RCTNetworkTask *_selfReference;
}

- (instancetype)initWithRequest:(NSURLRequest *)request
                        handler:(id<ABI5_0_0RCTURLRequestHandler>)handler
                completionBlock:(ABI5_0_0RCTURLRequestCompletionBlock)completionBlock
{
  ABI5_0_0RCTAssertParam(request);
  ABI5_0_0RCTAssertParam(handler);
  ABI5_0_0RCTAssertParam(completionBlock);

  static NSUInteger requestID = 0;

  if ((self = [super init])) {
    _requestID = @(requestID++);
    _request = request;
    _handler = handler;
    _completionBlock = completionBlock;
    _status = ABI5_0_0RCTNetworkTaskPending;
  }
  return self;
}

ABI5_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (void)invalidate
{
  _selfReference = nil;
  _completionBlock = nil;
  _downloadProgressBlock = nil;
  _incrementalDataBlock = nil;
  _responseBlock = nil;
  _uploadProgressBlock = nil;
}

- (void)start
{
  if (_requestToken == nil) {
    if ([self validateRequestToken:[_handler sendRequest:_request
                                            withDelegate:self]]) {
      _selfReference = self;
      _status = ABI5_0_0RCTNetworkTaskInProgress;
    }
  }
}

- (void)cancel
{
  __strong id strongToken = _requestToken;
  if (strongToken && [_handler respondsToSelector:@selector(cancelRequest:)]) {
    [_handler cancelRequest:strongToken];
  }
  [self invalidate];
  _status = ABI5_0_0RCTNetworkTaskFinished;
}

- (BOOL)validateRequestToken:(id)requestToken
{
  if (_requestToken == nil) {
    if (requestToken == nil) {
      return NO;
    }
    _requestToken = requestToken;
  }
  if (![requestToken isEqual:_requestToken]) {
    if (ABI5_0_0RCT_DEBUG) {
      ABI5_0_0RCTLogError(@"Unrecognized request token: %@ expected: %@", requestToken, _requestToken);
    }
    if (_completionBlock) {
      _completionBlock(_response, _data, [NSError errorWithDomain:ABI5_0_0RCTErrorDomain code:0
        userInfo:@{NSLocalizedDescriptionKey: @"Unrecognized request token."}]);
    }
    [self invalidate];
    _status = ABI5_0_0RCTNetworkTaskFinished;
    return NO;
  }
  return YES;
}

- (void)URLRequest:(id)requestToken didSendDataWithProgress:(int64_t)bytesSent
{
  if ([self validateRequestToken:requestToken]) {
    if (_uploadProgressBlock) {
      _uploadProgressBlock(bytesSent, _request.HTTPBody.length);
    }
  }
}

- (void)URLRequest:(id)requestToken didReceiveResponse:(NSURLResponse *)response
{
  if ([self validateRequestToken:requestToken]) {
    _response = response;
    if (_responseBlock) {
      _responseBlock(response);
    }
  }
}

- (void)URLRequest:(id)requestToken didReceiveData:(NSData *)data
{
  if ([self validateRequestToken:requestToken]) {
    if (!_data) {
      _data = [NSMutableData new];
    }
    [_data appendData:data];
    if (_incrementalDataBlock) {
      _incrementalDataBlock(data);
    }
    if (_downloadProgressBlock && _response.expectedContentLength > 0) {
      _downloadProgressBlock(_data.length, _response.expectedContentLength);
    }
  }
}

- (void)URLRequest:(id)requestToken didCompleteWithError:(NSError *)error
{
  if ([self validateRequestToken:requestToken]) {
    if (_completionBlock) {
      _completionBlock(_response, _data, error);
    }
    [self invalidate];
    _status = ABI5_0_0RCTNetworkTaskFinished;
  }
}

@end

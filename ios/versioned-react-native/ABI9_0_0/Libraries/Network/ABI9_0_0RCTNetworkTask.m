/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI9_0_0RCTNetworkTask.h"

#import "ABI9_0_0RCTLog.h"

@implementation ABI9_0_0RCTNetworkTask
{
  NSMutableData *_data;
  id<ABI9_0_0RCTURLRequestHandler> _handler;
  ABI9_0_0RCTNetworkTask *_selfReference;
}

- (instancetype)initWithRequest:(NSURLRequest *)request
                        handler:(id<ABI9_0_0RCTURLRequestHandler>)handler
                completionBlock:(ABI9_0_0RCTURLRequestCompletionBlock)completionBlock
{
  ABI9_0_0RCTAssertParam(request);
  ABI9_0_0RCTAssertParam(handler);
  ABI9_0_0RCTAssertParam(completionBlock);

  static NSUInteger requestID = 0;

  if ((self = [super init])) {
    _requestID = @(requestID++);
    _request = request;
    _handler = handler;
    _completionBlock = completionBlock;
    _status = ABI9_0_0RCTNetworkTaskPending;
  }
  return self;
}

ABI9_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)

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
      _status = ABI9_0_0RCTNetworkTaskInProgress;
    }
  }
}

- (void)cancel
{
  _status = ABI9_0_0RCTNetworkTaskFinished;
  __strong id strongToken = _requestToken;
  if (strongToken && [_handler respondsToSelector:@selector(cancelRequest:)]) {
    [_handler cancelRequest:strongToken];
  }
  [self invalidate];
}

- (BOOL)validateRequestToken:(id)requestToken
{
  BOOL valid = YES;
  if (_requestToken == nil) {
    if (requestToken == nil) {
      if (ABI9_0_0RCT_DEBUG) {
        ABI9_0_0RCTLogError(@"Missing request token for request: %@", _request);
      }
      valid = NO;
    }
    _requestToken = requestToken;
  } else if (![requestToken isEqual:_requestToken]) {
    if (ABI9_0_0RCT_DEBUG) {
      ABI9_0_0RCTLogError(@"Unrecognized request token: %@ expected: %@", requestToken, _requestToken);
    }
    valid = NO;
  }
  if (!valid) {
    _status = ABI9_0_0RCTNetworkTaskFinished;
    if (_completionBlock) {
      _completionBlock(_response, nil, [NSError errorWithDomain:ABI9_0_0RCTErrorDomain code:0
        userInfo:@{NSLocalizedDescriptionKey: @"Invalid request token."}]);
    }
    [self invalidate];
  }
  return valid;
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
      _incrementalDataBlock(data, _data.length, _response.expectedContentLength);
    }
    if (_downloadProgressBlock && _response.expectedContentLength > 0) {
      _downloadProgressBlock(_data.length, _response.expectedContentLength);
    }
  }
}

- (void)URLRequest:(id)requestToken didCompleteWithError:(NSError *)error
{
  if ([self validateRequestToken:requestToken]) {
    _status = ABI9_0_0RCTNetworkTaskFinished;
    if (_completionBlock) {
      _completionBlock(_response, _data, error);
    }
    [self invalidate];
  }
}

@end

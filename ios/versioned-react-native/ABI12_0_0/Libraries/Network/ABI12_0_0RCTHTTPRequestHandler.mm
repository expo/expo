/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI12_0_0RCTHTTPRequestHandler.h"

#import <mutex>

#import "ABI12_0_0RCTNetworking.h"
#import "ABI12_0_0RCTAssert.h"

@interface ABI12_0_0RCTHTTPRequestHandler () <NSURLSessionDataDelegate>

@end

@implementation ABI12_0_0RCTHTTPRequestHandler
{
  NSMapTable *_delegates;
  NSURLSession *_session;
  std::mutex _mutex;
}

@synthesize bridge = _bridge;
@synthesize methodQueue = _methodQueue;

ABI12_0_0RCT_EXPORT_MODULE()

- (void)invalidate
{
  [_session invalidateAndCancel];
  _session = nil;
}

- (BOOL)isValid
{
  // if session == nil and delegates != nil, we've been invalidated
  return _session || !_delegates;
}

- (dispatch_queue_t)methodQueue
{
  if (!_methodQueue) {
    _methodQueue = [_bridge.networking methodQueue];
  }
  return _methodQueue;
}

#pragma mark - NSURLRequestHandler

- (BOOL)canHandleRequest:(NSURLRequest *)request
{
  static NSSet<NSString *> *schemes = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    // technically, ABI12_0_0RCTHTTPRequestHandler can handle file:// as well,
    // but it's less efficient than using ABI12_0_0RCTFileRequestHandler
    schemes = [[NSSet alloc] initWithObjects:@"http", @"https", nil];
  });
  return [schemes containsObject:request.URL.scheme.lowercaseString];
}

- (NSURLSessionDataTask *)sendRequest:(NSURLRequest *)request
                         withDelegate:(id<ABI12_0_0RCTURLRequestDelegate>)delegate
{
  // Lazy setup
  if (!_session && [self isValid]) {
    NSOperationQueue *callbackQueue = [NSOperationQueue new];
    callbackQueue.maxConcurrentOperationCount = 1;
    callbackQueue.underlyingQueue = self.methodQueue;
    NSURLSessionConfiguration *configuration = [NSURLSessionConfiguration defaultSessionConfiguration];
    _session = [NSURLSession sessionWithConfiguration:configuration
                                             delegate:self
                                        delegateQueue:callbackQueue];

    std::lock_guard<std::mutex> lock(_mutex);
    _delegates = [NSMapTable strongToStrongObjectsMapTable];
  }

  NSURLSessionDataTask *task = [_session dataTaskWithRequest:request];
  {
    std::lock_guard<std::mutex> lock(_mutex);
    [_delegates setObject:delegate forKey:task];
  }
  [task resume];
  return task;
}

- (void)cancelRequest:(NSURLSessionDataTask *)task
{
  [_session.delegateQueue addOperationWithBlock:^{
    [task cancel];
  }];
}

#pragma mark - NSURLSession delegate

- (void)URLSession:(NSURLSession *)session
              task:(NSURLSessionTask *)task
   didSendBodyData:(int64_t)bytesSent
    totalBytesSent:(int64_t)totalBytesSent
totalBytesExpectedToSend:(int64_t)totalBytesExpectedToSend
{
  id<ABI12_0_0RCTURLRequestDelegate> delegate;
  {
    std::lock_guard<std::mutex> lock(_mutex);
    delegate = [_delegates objectForKey:task];
  }
  [delegate URLRequest:task didSendDataWithProgress:totalBytesSent];
}

- (void)URLSession:(NSURLSession *)session
          dataTask:(NSURLSessionDataTask *)task
didReceiveResponse:(NSURLResponse *)response
 completionHandler:(void (^)(NSURLSessionResponseDisposition))completionHandler
{
  id<ABI12_0_0RCTURLRequestDelegate> delegate;
  {
    std::lock_guard<std::mutex> lock(_mutex);
    delegate = [_delegates objectForKey:task];
  }
  [delegate URLRequest:task didReceiveResponse:response];
  completionHandler(NSURLSessionResponseAllow);
}

- (void)URLSession:(NSURLSession *)session
          dataTask:(NSURLSessionDataTask *)task
    didReceiveData:(NSData *)data
{
  id<ABI12_0_0RCTURLRequestDelegate> delegate;
  {
    std::lock_guard<std::mutex> lock(_mutex);
    delegate = [_delegates objectForKey:task];
  }
  [delegate URLRequest:task didReceiveData:data];
}

- (void)URLSession:(NSURLSession *)session task:(NSURLSessionTask *)task didCompleteWithError:(NSError *)error
{
  id<ABI12_0_0RCTURLRequestDelegate> delegate;
  {
    std::lock_guard<std::mutex> lock(_mutex);
    delegate = [_delegates objectForKey:task];
  }

  // Oh NSURLSession. Prevent leaks and crashes by delaying the task removal
  // until this method has returned.
  [self->_session.delegateQueue addOperationWithBlock:^{
    std::lock_guard<std::mutex> lock(self->_mutex);
    [self->_delegates removeObjectForKey:task];
  }];

  ABI12_0_0RCTAssert(delegate, @"Delegate must not be nil");
  [delegate URLRequest:task didCompleteWithError:error];
}

@end

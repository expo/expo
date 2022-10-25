/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI47_0_0React/ABI47_0_0RCTHTTPRequestHandler.h>

#import <mutex>

#import <ABI47_0_0React/ABI47_0_0RCTNetworking.h>
#import <ABI47_0_0ReactCommon/ABI47_0_0RCTTurboModule.h>

#import "ABI47_0_0RCTNetworkPlugins.h"

@interface ABI47_0_0RCTHTTPRequestHandler () <NSURLSessionDataDelegate, ABI47_0_0RCTTurboModule>

@end

static NSURLSessionConfigurationProvider urlSessionConfigurationProvider;

void ABI47_0_0RCTSetCustomNSURLSessionConfigurationProvider(NSURLSessionConfigurationProvider provider) {
  urlSessionConfigurationProvider = provider;
}

@implementation ABI47_0_0RCTHTTPRequestHandler
{
  NSMapTable *_delegates;
  NSURLSession *_session;
  std::mutex _mutex;
}

@synthesize moduleRegistry = _moduleRegistry;
@synthesize methodQueue = _methodQueue;

ABI47_0_0RCT_EXPORT_MODULE()

- (void)invalidate
{
  std::lock_guard<std::mutex> lock(_mutex);
  [self->_session invalidateAndCancel];
  self->_session = nil;
}

// Needs to lock before call this method.
- (BOOL)isValid
{
  // if session == nil and delegates != nil, we've been invalidated
  return _session || !_delegates;
}

#pragma mark - NSURLRequestHandler

- (BOOL)canHandleRequest:(NSURLRequest *)request
{
  static NSSet<NSString *> *schemes = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    // technically, ABI47_0_0RCTHTTPRequestHandler can handle file:// as well,
    // but it's less efficient than using ABI47_0_0RCTFileRequestHandler
    schemes = [[NSSet alloc] initWithObjects:@"http", @"https", nil];
  });
  return [schemes containsObject:request.URL.scheme.lowercaseString];
}

- (NSURLSessionDataTask *)sendRequest:(NSURLRequest *)request
                         withDelegate:(id<ABI47_0_0RCTURLRequestDelegate>)delegate
{
  std::lock_guard<std::mutex> lock(_mutex);
  // Lazy setup
  if (!_session && [self isValid]) {
    // You can override default NSURLSession instance property allowsCellularAccess (default value YES)
    //  by providing the following key to your ABI47_0_0RN project (edit ios/project/Info.plist file in Xcode):
    // <key>ABI47_0_0ReactNetworkForceWifiOnly</key>    <true/>
    // This will set allowsCellularAccess to NO and force Wifi only for all network calls on iOS
    // If you do not want to override default behavior, do nothing or set key with value false
    NSDictionary *infoDictionary = [[NSBundle mainBundle] infoDictionary];
    NSNumber *useWifiOnly = [infoDictionary objectForKey:@"ABI47_0_0ReactNetworkForceWifiOnly"];

    NSOperationQueue *callbackQueue = [NSOperationQueue new];
    callbackQueue.maxConcurrentOperationCount = 1;
    callbackQueue.underlyingQueue = [[_moduleRegistry moduleForName:"Networking"] methodQueue];
    NSURLSessionConfiguration *configuration;
    if (urlSessionConfigurationProvider) {
      configuration = urlSessionConfigurationProvider();
    } else {
      configuration = [NSURLSessionConfiguration defaultSessionConfiguration];
      // Set allowsCellularAccess to NO ONLY if key ABI47_0_0ReactNetworkForceWifiOnly exists AND its value is YES
      if (useWifiOnly) {
        configuration.allowsCellularAccess = ![useWifiOnly boolValue];
      }
      [configuration setHTTPShouldSetCookies:YES];
      [configuration setHTTPCookieAcceptPolicy:NSHTTPCookieAcceptPolicyAlways];
      [configuration setHTTPCookieStorage:[NSHTTPCookieStorage sharedHTTPCookieStorage]];
    }
    assert(configuration != nil);
    _session = [NSURLSession sessionWithConfiguration:configuration
                                             delegate:self
                                        delegateQueue:callbackQueue];

    _delegates = [[NSMapTable alloc] initWithKeyOptions:NSPointerFunctionsStrongMemory
                                           valueOptions:NSPointerFunctionsStrongMemory
                                               capacity:0];
  }
  NSURLSessionDataTask *task = [_session dataTaskWithRequest:request];
  [_delegates setObject:delegate forKey:task];
  [task resume];
  return task;
}

- (void)cancelRequest:(NSURLSessionDataTask *)task
{
  {
    std::lock_guard<std::mutex> lock(_mutex);
    [_delegates removeObjectForKey:task];
  }
  [task cancel];
}

#pragma mark - NSURLSession delegate

- (void)URLSession:(NSURLSession *)session
              task:(NSURLSessionTask *)task
   didSendBodyData:(int64_t)bytesSent
    totalBytesSent:(int64_t)totalBytesSent
totalBytesExpectedToSend:(int64_t)totalBytesExpectedToSend
{
  id<ABI47_0_0RCTURLRequestDelegate> delegate;
  {
    std::lock_guard<std::mutex> lock(_mutex);
    delegate = [_delegates objectForKey:task];
  }
  [delegate URLRequest:task didSendDataWithProgress:totalBytesSent];
}

- (void)URLSession:(NSURLSession *)session
              task:(NSURLSessionTask *)task
willPerformHTTPRedirection:(NSHTTPURLResponse *)response
        newRequest:(NSURLRequest *)request
 completionHandler:(void (^)(NSURLRequest *))completionHandler
{
  // Reset the cookies on redirect.
  // This is necessary because we're not letting iOS handle cookies by itself
  NSMutableURLRequest *nextRequest = [request mutableCopy];

  NSArray<NSHTTPCookie *> *cookies = [[NSHTTPCookieStorage sharedHTTPCookieStorage] cookiesForURL:request.URL];
  nextRequest.allHTTPHeaderFields = [NSHTTPCookie requestHeaderFieldsWithCookies:cookies];
  completionHandler(nextRequest);
}

- (void)URLSession:(NSURLSession *)session
          dataTask:(NSURLSessionDataTask *)task
didReceiveResponse:(NSURLResponse *)response
 completionHandler:(void (^)(NSURLSessionResponseDisposition))completionHandler
{
  id<ABI47_0_0RCTURLRequestDelegate> delegate;
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
  id<ABI47_0_0RCTURLRequestDelegate> delegate;
  {
    std::lock_guard<std::mutex> lock(_mutex);
    delegate = [_delegates objectForKey:task];
  }
  [delegate URLRequest:task didReceiveData:data];
}

- (void)URLSession:(NSURLSession *)session task:(NSURLSessionTask *)task didCompleteWithError:(NSError *)error
{
  id<ABI47_0_0RCTURLRequestDelegate> delegate;
  {
    std::lock_guard<std::mutex> lock(_mutex);
    delegate = [_delegates objectForKey:task];
    [_delegates removeObjectForKey:task];
  }
  [delegate URLRequest:task didCompleteWithError:error];
}

- (std::shared_ptr<ABI47_0_0facebook::ABI47_0_0React::TurboModule>)getTurboModule:
    (const ABI47_0_0facebook::ABI47_0_0React::ObjCTurboModule::InitParams &)params
{
  return nullptr;
}

@end

Class ABI47_0_0RCTHTTPRequestHandlerCls(void) {
  return ABI47_0_0RCTHTTPRequestHandler.class;
}

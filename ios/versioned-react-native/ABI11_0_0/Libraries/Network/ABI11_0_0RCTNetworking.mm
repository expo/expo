/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI11_0_0RCTNetworking.h"

#include <mutex>

#import "ABI11_0_0RCTAssert.h"
#import "ABI11_0_0RCTConvert.h"
#import "ABI11_0_0RCTNetworkTask.h"
#import "ABI11_0_0RCTURLRequestHandler.h"
#import "ABI11_0_0RCTEventDispatcher.h"
#import "ABI11_0_0RCTHTTPRequestHandler.h"
#import "ABI11_0_0RCTLog.h"
#import "ABI11_0_0RCTUtils.h"

typedef ABI11_0_0RCTURLRequestCancellationBlock (^ABI11_0_0RCTHTTPQueryResult)(NSError *error, NSDictionary<NSString *, id> *result);

@interface ABI11_0_0RCTNetworking ()

- (ABI11_0_0RCTURLRequestCancellationBlock)processDataForHTTPQuery:(NSDictionary<NSString *, id> *)data
                                                 callback:(ABI11_0_0RCTHTTPQueryResult)callback;
@end

/**
 * Helper to convert FormData payloads into multipart/formdata requests.
 */
@interface ABI11_0_0RCTHTTPFormDataHelper : NSObject

@property (nonatomic, weak) ABI11_0_0RCTNetworking *networker;

@end

@implementation ABI11_0_0RCTHTTPFormDataHelper
{
  NSMutableArray<NSDictionary<NSString *, id> *> *_parts;
  NSMutableData *_multipartBody;
  ABI11_0_0RCTHTTPQueryResult _callback;
  NSString *_boundary;
}

static NSString *ABI11_0_0RCTGenerateFormBoundary()
{
  const size_t boundaryLength = 70;
  const char *boundaryChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_./";

  char *bytes = (char*)malloc(boundaryLength);
  size_t charCount = strlen(boundaryChars);
  for (int i = 0; i < boundaryLength; i++) {
    bytes[i] = boundaryChars[arc4random_uniform((u_int32_t)charCount)];
  }
  return [[NSString alloc] initWithBytesNoCopy:bytes length:boundaryLength encoding:NSUTF8StringEncoding freeWhenDone:YES];
}

- (ABI11_0_0RCTURLRequestCancellationBlock)process:(NSArray<NSDictionary *> *)formData
                                 callback:(ABI11_0_0RCTHTTPQueryResult)callback
{
  ABI11_0_0RCTAssertThread(_networker.methodQueue, @"process: must be called on method queue");

  if (formData.count == 0) {
    return callback(nil, nil);
  }

  _parts = [formData mutableCopy];
  _callback = callback;
  _multipartBody = [NSMutableData new];
  _boundary = ABI11_0_0RCTGenerateFormBoundary();

  return [_networker processDataForHTTPQuery:_parts[0] callback:^(NSError *error, NSDictionary<NSString *, id> *result) {
    return [self handleResult:result error:error];
  }];
}

- (ABI11_0_0RCTURLRequestCancellationBlock)handleResult:(NSDictionary<NSString *, id> *)result
                                         error:(NSError *)error
{
  ABI11_0_0RCTAssertThread(_networker.methodQueue, @"handleResult: must be called on method queue");

  if (error) {
    return _callback(error, nil);
  }

  // Start with boundary.
  [_multipartBody appendData:[[NSString stringWithFormat:@"--%@\r\n", _boundary]
                              dataUsingEncoding:NSUTF8StringEncoding]];

  // Print headers.
  NSMutableDictionary<NSString *, NSString *> *headers = [_parts[0][@"headers"] mutableCopy];
  NSString *partContentType = result[@"contentType"];
  if (partContentType != nil) {
    headers[@"content-type"] = partContentType;
  }
  [headers enumerateKeysAndObjectsUsingBlock:^(NSString *parameterKey, NSString *parameterValue, BOOL *stop) {
    [self->_multipartBody appendData:[[NSString stringWithFormat:@"%@: %@\r\n", parameterKey, parameterValue]
                                dataUsingEncoding:NSUTF8StringEncoding]];
  }];

  // Add the body.
  [_multipartBody appendData:[@"\r\n" dataUsingEncoding:NSUTF8StringEncoding]];
  [_multipartBody appendData:result[@"body"]];
  [_multipartBody appendData:[@"\r\n" dataUsingEncoding:NSUTF8StringEncoding]];

  [_parts removeObjectAtIndex:0];
  if (_parts.count) {
    return [_networker processDataForHTTPQuery:_parts[0] callback:^(NSError *err, NSDictionary<NSString *, id> *res) {
      return [self handleResult:res error:err];
    }];
  }

  // We've processed the last item. Finish and return.
  [_multipartBody appendData:[[NSString stringWithFormat:@"--%@--\r\n", _boundary]
                              dataUsingEncoding:NSUTF8StringEncoding]];
  NSString *contentType = [NSString stringWithFormat:@"multipart/form-data; boundary=\"%@\"", _boundary];
  return _callback(nil, @{@"body": _multipartBody, @"contentType": contentType});
}

@end

/**
 * Bridge module that provides the JS interface to the network stack.
 */
@implementation ABI11_0_0RCTNetworking
{
  NSMutableDictionary<NSNumber *, ABI11_0_0RCTNetworkTask *> *_tasksByRequestID;
  std::mutex _handlersLock;
  NSArray<id<ABI11_0_0RCTURLRequestHandler>> *_handlers;
}

@synthesize methodQueue = _methodQueue;

ABI11_0_0RCT_EXPORT_MODULE()

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"didCompleteNetworkResponse",
           @"didReceiveNetworkResponse",
           @"didSendNetworkData",
           @"didReceiveNetworkIncrementalData",
           @"didReceiveNetworkDataProgress",
           @"didReceiveNetworkData"];
}

- (id<ABI11_0_0RCTURLRequestHandler>)handlerForRequest:(NSURLRequest *)request
{
  if (!request.URL) {
    return nil;
  }

  {
    std::lock_guard<std::mutex> lock(_handlersLock);

    if (!_handlers) {
      // Get handlers, sorted in reverse priority order (highest priority first)
      _handlers = [[self.bridge modulesConformingToProtocol:@protocol(ABI11_0_0RCTURLRequestHandler)] sortedArrayUsingComparator:^NSComparisonResult(id<ABI11_0_0RCTURLRequestHandler> a, id<ABI11_0_0RCTURLRequestHandler> b) {
        float priorityA = [a respondsToSelector:@selector(handlerPriority)] ? [a handlerPriority] : 0;
        float priorityB = [b respondsToSelector:@selector(handlerPriority)] ? [b handlerPriority] : 0;
        if (priorityA > priorityB) {
          return NSOrderedAscending;
        } else if (priorityA < priorityB) {
          return NSOrderedDescending;
        } else {
          return NSOrderedSame;
        }
      }];
    }
  }

  if (ABI11_0_0RCT_DEBUG) {
    // Check for handler conflicts
    float previousPriority = 0;
    id<ABI11_0_0RCTURLRequestHandler> previousHandler = nil;
    for (id<ABI11_0_0RCTURLRequestHandler> handler in _handlers) {
      float priority = [handler respondsToSelector:@selector(handlerPriority)] ? [handler handlerPriority] : 0;
      if (previousHandler && priority < previousPriority) {
        return previousHandler;
      }
      if ([handler canHandleRequest:request]) {
        if (previousHandler) {
          if (priority == previousPriority) {
            ABI11_0_0RCTLogError(@"The ABI11_0_0RCTURLRequestHandlers %@ and %@ both reported that"
                        " they can handle the request %@, and have equal priority"
                        " (%g). This could result in non-deterministic behavior.",
                        handler, previousHandler, request, priority);
          }
        } else {
          previousHandler = handler;
          previousPriority = priority;
        }
      }
    }
    return previousHandler;
  }

  // Normal code path
  for (id<ABI11_0_0RCTURLRequestHandler> handler in _handlers) {
    if ([handler canHandleRequest:request]) {
      return handler;
    }
  }
  return nil;
}

- (NSDictionary<NSString *, id> *)stripNullsInRequestHeaders:(NSDictionary<NSString *, id> *)headers
{
  NSMutableDictionary *result = [NSMutableDictionary dictionaryWithCapacity:headers.count];
  for (NSString *key in headers.allKeys) {
    id val = headers[key];
    if (val != [NSNull null]) {
      result[key] = val;
    }
  }

  return result;
}

- (ABI11_0_0RCTURLRequestCancellationBlock)buildRequest:(NSDictionary<NSString *, id> *)query
                                 completionBlock:(void (^)(NSURLRequest *request))block
{
  ABI11_0_0RCTAssertThread(_methodQueue, @"buildRequest: must be called on method queue");

  NSURL *URL = [ABI11_0_0RCTConvert NSURL:query[@"url"]]; // this is marked as nullable in JS, but should not be null
  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:URL];
  request.HTTPMethod = [ABI11_0_0RCTConvert NSString:ABI11_0_0RCTNilIfNull(query[@"method"])].uppercaseString ?: @"GET";
  request.allHTTPHeaderFields = [self stripNullsInRequestHeaders:[ABI11_0_0RCTConvert NSDictionary:query[@"headers"]]];
  request.timeoutInterval = [ABI11_0_0RCTConvert NSTimeInterval:query[@"timeout"]];
  NSDictionary<NSString *, id> *data = [ABI11_0_0RCTConvert NSDictionary:ABI11_0_0RCTNilIfNull(query[@"data"])];
  NSString *trackingName = data[@"trackingName"];
  if (trackingName) {
    [NSURLProtocol setProperty:trackingName
                        forKey:@"trackingName"
                     inRequest:request];
  }
  return [self processDataForHTTPQuery:data callback:^(NSError *error, NSDictionary<NSString *, id> *result) {
    if (error) {
      ABI11_0_0RCTLogError(@"Error processing request body: %@", error);
      // Ideally we'd circle back to JS here and notify an error/abort on the request.
      return (ABI11_0_0RCTURLRequestCancellationBlock)nil;
    }
    request.HTTPBody = result[@"body"];
    NSString *dataContentType = result[@"contentType"];
    NSString *requestContentType = [request valueForHTTPHeaderField:@"Content-Type"];
    BOOL isMultipart = [dataContentType hasPrefix:@"multipart"];
    
    // For multipart requests we need to override caller-specified content type with one
    // from the data object, because it contains the boundary string
    if (dataContentType && ([requestContentType length] == 0 || isMultipart)) {
      [request setValue:dataContentType forHTTPHeaderField:@"Content-Type"];
    }

    // Gzip the request body
    if ([request.allHTTPHeaderFields[@"Content-Encoding"] isEqualToString:@"gzip"]) {
      request.HTTPBody = ABI11_0_0RCTGzipData(request.HTTPBody, -1 /* default */);
      [request setValue:(@(request.HTTPBody.length)).description forHTTPHeaderField:@"Content-Length"];
    }

    dispatch_async(self->_methodQueue, ^{
      block(request);
    });

    return (ABI11_0_0RCTURLRequestCancellationBlock)nil;
  }];
}

- (BOOL)canHandleRequest:(NSURLRequest *)request
{
  return [self handlerForRequest:request] != nil;
}

/**
 * Process the 'data' part of an HTTP query.
 *
 * 'data' can be a JSON value of the following forms:
 *
 * - {"string": "..."}: a simple JS string that will be UTF-8 encoded and sent as the body
 *
 * - {"uri": "some-uri://..."}: reference to a system resource, e.g. an image in the asset library
 *
 * - {"formData": [...]}: list of data payloads that will be combined into a multipart/form-data request
 *
 * If successful, the callback be called with a result dictionary containing the following (optional) keys:
 *
 * - @"body" (NSData): the body of the request
 *
 * - @"contentType" (NSString): the content type header of the request
 *
 */
- (ABI11_0_0RCTURLRequestCancellationBlock)processDataForHTTPQuery:(nullable NSDictionary<NSString *, id> *)query callback:
(ABI11_0_0RCTURLRequestCancellationBlock (^)(NSError *error, NSDictionary<NSString *, id> *result))callback
{
  ABI11_0_0RCTAssertThread(_methodQueue, @"processDataForHTTPQuery: must be called on method queue");

  if (!query) {
    return callback(nil, nil);
  }
  NSData *body = [ABI11_0_0RCTConvert NSData:query[@"string"]];
  if (body) {
    return callback(nil, @{@"body": body});
  }
  NSURLRequest *request = [ABI11_0_0RCTConvert NSURLRequest:query[@"uri"]];
  if (request) {

    __block ABI11_0_0RCTURLRequestCancellationBlock cancellationBlock = nil;
    ABI11_0_0RCTNetworkTask *task = [self networkTaskWithRequest:request completionBlock:^(NSURLResponse *response, NSData *data, NSError *error) {
      dispatch_async(self->_methodQueue, ^{
        cancellationBlock = callback(error, data ? @{@"body": data, @"contentType": ABI11_0_0RCTNullIfNil(response.MIMEType)} : nil);
      });
    }];

    [task start];

    __weak ABI11_0_0RCTNetworkTask *weakTask = task;
    return ^{
      [weakTask cancel];
      if (cancellationBlock) {
        cancellationBlock();
      }
    };
  }
  NSArray<NSDictionary *> *formData = [ABI11_0_0RCTConvert NSDictionaryArray:query[@"formData"]];
  if (formData) {
    ABI11_0_0RCTHTTPFormDataHelper *formDataHelper = [ABI11_0_0RCTHTTPFormDataHelper new];
    formDataHelper.networker = self;
    return [formDataHelper process:formData callback:callback];
  }
  // Nothing in the data payload, at least nothing we could understand anyway.
  // Ignore and treat it as if it were null.
  return callback(nil, nil);
}

+ (NSString *)decodeTextData:(NSData *)data fromResponse:(NSURLResponse *)response
{
  NSStringEncoding encoding = NSUTF8StringEncoding;
  if (response.textEncodingName) {
    CFStringEncoding cfEncoding = CFStringConvertIANACharSetNameToEncoding((CFStringRef)response.textEncodingName);
    encoding = CFStringConvertEncodingToNSStringEncoding(cfEncoding);
  }
  // Attempt to decode text
  NSString *encodedResponse = [[NSString alloc] initWithData:data encoding:encoding];
  if (!encodedResponse && data.length) {
    // We don't have an encoding, or the encoding is incorrect, so now we try to guess
    [NSString stringEncodingForData:data
                    encodingOptions:nil
                    convertedString:&encodedResponse
                usedLossyConversion:NULL];
  }
  return encodedResponse;
}

- (void)sendData:(NSData *)data
    responseType:(NSString *)responseType
         forTask:(ABI11_0_0RCTNetworkTask *)task
{
  ABI11_0_0RCTAssertThread(_methodQueue, @"sendData: must be called on method queue");

  if (data.length == 0) {
    return;
  }

  NSString *responseString;
  if ([responseType isEqualToString:@"text"]) {
    responseString = [ABI11_0_0RCTNetworking decodeTextData:data fromResponse:task.response];
    if (!responseString) {
      ABI11_0_0RCTLogWarn(@"Received data was not a string, or was not a recognised encoding.");
      return;
    }
  } else if ([responseType isEqualToString:@"base64"]) {
    responseString = [data base64EncodedStringWithOptions:0];
  } else {
    ABI11_0_0RCTLogWarn(@"Invalid responseType: %@", responseType);
    return;
  }

  NSArray<id> *responseJSON = @[task.requestID, responseString];
  [self sendEventWithName:@"didReceiveNetworkData" body:responseJSON];
}

- (void)sendRequest:(NSURLRequest *)request
       responseType:(NSString *)responseType
 incrementalUpdates:(BOOL)incrementalUpdates
     responseSender:(ABI11_0_0RCTResponseSenderBlock)responseSender
{
  ABI11_0_0RCTAssertThread(_methodQueue, @"sendRequest: must be called on method queue");

  __block ABI11_0_0RCTNetworkTask *task;
  ABI11_0_0RCTURLRequestProgressBlock uploadProgressBlock = ^(int64_t progress, int64_t total) {
    NSArray *responseJSON = @[task.requestID, @((double)progress), @((double)total)];
    [self sendEventWithName:@"didSendNetworkData" body:responseJSON];
  };

  ABI11_0_0RCTURLRequestResponseBlock responseBlock = ^(NSURLResponse *response) {
    NSDictionary<NSString *, NSString *> *headers;
    NSInteger status;
    if ([response isKindOfClass:[NSHTTPURLResponse class]]) { // Might be a local file request
      NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)response;
      headers = httpResponse.allHeaderFields ?: @{};
      status = httpResponse.statusCode;
    } else {
      headers = response.MIMEType ? @{@"Content-Type": response.MIMEType} : @{};
      status = 200;
    }
    id responseURL = response.URL ? response.URL.absoluteString : [NSNull null];
    NSArray<id> *responseJSON = @[task.requestID, @(status), headers, responseURL];
    [self sendEventWithName:@"didReceiveNetworkResponse" body:responseJSON];
  };

  // XHR does not allow you to peek at xhr.response before the response is
  // finished. Only when xhr.responseType is set to ''/'text', consumers may
  // peek at xhr.responseText. So unless the requested responseType is 'text',
  // we only send progress updates and not incremental data updates to JS here.
  ABI11_0_0RCTURLRequestIncrementalDataBlock incrementalDataBlock = nil;
  ABI11_0_0RCTURLRequestProgressBlock downloadProgressBlock = nil;
  if (incrementalUpdates) {
    if ([responseType isEqualToString:@"text"]) {
      incrementalDataBlock = ^(NSData *data, int64_t progress, int64_t total) {
        NSString *responseString = [ABI11_0_0RCTNetworking decodeTextData:data fromResponse:task.response];
        if (!responseString) {
          ABI11_0_0RCTLogWarn(@"Received data was not a string, or was not a recognised encoding.");
          return;
        }
        NSArray<id> *responseJSON = @[task.requestID, responseString, @(progress), @(total)];
        [self sendEventWithName:@"didReceiveNetworkIncrementalData" body:responseJSON];
      };
    } else {
      downloadProgressBlock = ^(int64_t progress, int64_t total) {
        NSArray<id> *responseJSON = @[task.requestID, @(progress), @(total)];
        [self sendEventWithName:@"didReceiveNetworkDataProgress" body:responseJSON];
      };
    }
  }

  ABI11_0_0RCTURLRequestCompletionBlock completionBlock =
  ^(NSURLResponse *response, NSData *data, NSError *error) {
    // Unless we were sending incremental (text) chunks to JS, all along, now
    // is the time to send the request body to JS.
    if (!(incrementalUpdates && [responseType isEqualToString:@"text"])) {
      [self sendData:data
        responseType:responseType
             forTask:task];
    }
    NSArray *responseJSON = @[task.requestID,
                              ABI11_0_0RCTNullIfNil(error.localizedDescription),
                              error.code == kCFURLErrorTimedOut ? @YES : @NO
                              ];

    [self sendEventWithName:@"didCompleteNetworkResponse" body:responseJSON];
    [self->_tasksByRequestID removeObjectForKey:task.requestID];
  };

  task = [self networkTaskWithRequest:request completionBlock:completionBlock];
  task.downloadProgressBlock = downloadProgressBlock;
  task.incrementalDataBlock = incrementalDataBlock;
  task.responseBlock = responseBlock;
  task.uploadProgressBlock = uploadProgressBlock;

  if (task.requestID) {
    if (!_tasksByRequestID) {
      _tasksByRequestID = [NSMutableDictionary new];
    }
    _tasksByRequestID[task.requestID] = task;
    responseSender(@[task.requestID]);
  }

  [task start];
}

#pragma mark - Public API

- (ABI11_0_0RCTNetworkTask *)networkTaskWithRequest:(NSURLRequest *)request completionBlock:(ABI11_0_0RCTURLRequestCompletionBlock)completionBlock
{
  id<ABI11_0_0RCTURLRequestHandler> handler = [self handlerForRequest:request];
  if (!handler) {
    ABI11_0_0RCTLogError(@"No suitable URL request handler found for %@", request.URL);
    return nil;
  }

  ABI11_0_0RCTNetworkTask *task = [[ABI11_0_0RCTNetworkTask alloc] initWithRequest:request
                                                         handler:handler
                                                   callbackQueue:_methodQueue];
  task.completionBlock = completionBlock;
  return task;
}

#pragma mark - JS API

ABI11_0_0RCT_EXPORT_METHOD(sendRequest:(NSDictionary *)query
                  responseSender:(ABI11_0_0RCTResponseSenderBlock)responseSender)
{
  // TODO: buildRequest returns a cancellation block, but there's currently
  // no way to invoke it, if, for example the request is cancelled while
  // loading a large file to build the request body
  [self buildRequest:query completionBlock:^(NSURLRequest *request) {
    NSString *responseType = [ABI11_0_0RCTConvert NSString:query[@"responseType"]];
    BOOL incrementalUpdates = [ABI11_0_0RCTConvert BOOL:query[@"incrementalUpdates"]];
    [self sendRequest:request
         responseType:responseType
   incrementalUpdates:incrementalUpdates
       responseSender:responseSender];
  }];
}

ABI11_0_0RCT_EXPORT_METHOD(abortRequest:(nonnull NSNumber *)requestID)
{
  [_tasksByRequestID[requestID] cancel];
  [_tasksByRequestID removeObjectForKey:requestID];
}

ABI11_0_0RCT_EXPORT_METHOD(clearCookies:(ABI11_0_0RCTResponseSenderBlock)responseSender)
{
  NSHTTPCookieStorage *storage = [NSHTTPCookieStorage sharedHTTPCookieStorage];
  if (!storage.cookies.count) {
    responseSender(@[@NO]);
    return;
  }

  for (NSHTTPCookie *cookie in storage.cookies) {
    [storage deleteCookie:cookie];
  }
  responseSender(@[@YES]);
}

@end

@implementation ABI11_0_0RCTBridge (ABI11_0_0RCTNetworking)

- (ABI11_0_0RCTNetworking *)networking
{
  return [self moduleForClass:[ABI11_0_0RCTNetworking class]];
}

@end

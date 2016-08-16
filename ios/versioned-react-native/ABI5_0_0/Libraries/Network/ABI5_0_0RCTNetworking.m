/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI5_0_0RCTNetworking.h"

#import "ABI5_0_0RCTAssert.h"
#import "ABI5_0_0RCTConvert.h"
#import "ABI5_0_0RCTNetworkTask.h"
#import "ABI5_0_0RCTURLRequestHandler.h"
#import "ABI5_0_0RCTEventDispatcher.h"
#import "ABI5_0_0RCTHTTPRequestHandler.h"
#import "ABI5_0_0RCTLog.h"
#import "ABI5_0_0RCTUtils.h"

typedef ABI5_0_0RCTURLRequestCancellationBlock (^ABI5_0_0RCTHTTPQueryResult)(NSError *error, NSDictionary<NSString *, id> *result);

@interface ABI5_0_0RCTNetworking ()

- (ABI5_0_0RCTURLRequestCancellationBlock)processDataForHTTPQuery:(NSDictionary<NSString *, id> *)data
                                                 callback:(ABI5_0_0RCTHTTPQueryResult)callback;
@end

/**
 * Helper to convert FormData payloads into multipart/formdata requests.
 */
@interface ABI5_0_0RCTHTTPFormDataHelper : NSObject

@property (nonatomic, weak) ABI5_0_0RCTNetworking *networker;

@end

@implementation ABI5_0_0RCTHTTPFormDataHelper
{
  NSMutableArray<NSDictionary<NSString *, id> *> *_parts;
  NSMutableData *_multipartBody;
  ABI5_0_0RCTHTTPQueryResult _callback;
  NSString *_boundary;
}

static NSString *ABI5_0_0RCTGenerateFormBoundary()
{
  const size_t boundaryLength = 70;
  const char *boundaryChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_./";

  char *bytes = malloc(boundaryLength);
  size_t charCount = strlen(boundaryChars);
  for (int i = 0; i < boundaryLength; i++) {
    bytes[i] = boundaryChars[arc4random_uniform((u_int32_t)charCount)];
  }
  return [[NSString alloc] initWithBytesNoCopy:bytes length:boundaryLength encoding:NSUTF8StringEncoding freeWhenDone:YES];
}

- (ABI5_0_0RCTURLRequestCancellationBlock)process:(NSArray<NSDictionary *> *)formData
                                 callback:(ABI5_0_0RCTHTTPQueryResult)callback
{
  ABI5_0_0RCTAssertThread(_networker.methodQueue, @"process: must be called on method queue");

  if (formData.count == 0) {
    return callback(nil, nil);
  }

  _parts = [formData mutableCopy];
  _callback = callback;
  _multipartBody = [NSMutableData new];
  _boundary = ABI5_0_0RCTGenerateFormBoundary();

  return [_networker processDataForHTTPQuery:_parts[0] callback:^(NSError *error, NSDictionary<NSString *, id> *result) {
    return [self handleResult:result error:error];
  }];
}

- (ABI5_0_0RCTURLRequestCancellationBlock)handleResult:(NSDictionary<NSString *, id> *)result
                                         error:(NSError *)error
{
  ABI5_0_0RCTAssertThread(_networker.methodQueue, @"handleResult: must be called on method queue");

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
    [_multipartBody appendData:[[NSString stringWithFormat:@"%@: %@\r\n", parameterKey, parameterValue]
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
@implementation ABI5_0_0RCTNetworking
{
  NSMutableDictionary<NSNumber *, ABI5_0_0RCTNetworkTask *> *_tasksByRequestID;
  NSArray<id<ABI5_0_0RCTURLRequestHandler>> *_handlers;
}

@synthesize bridge = _bridge;
@synthesize methodQueue = _methodQueue;

ABI5_0_0RCT_EXPORT_MODULE()

- (id<ABI5_0_0RCTURLRequestHandler>)handlerForRequest:(NSURLRequest *)request
{
  if (!request.URL) {
    return nil;
  }

  if (!_handlers) {
    // Get handlers, sorted in reverse priority order (highest priority first)
    _handlers = [[_bridge modulesConformingToProtocol:@protocol(ABI5_0_0RCTURLRequestHandler)] sortedArrayUsingComparator:^NSComparisonResult(id<ABI5_0_0RCTURLRequestHandler> a, id<ABI5_0_0RCTURLRequestHandler> b) {
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

  if (ABI5_0_0RCT_DEBUG) {
    // Check for handler conflicts
    float previousPriority = 0;
    id<ABI5_0_0RCTURLRequestHandler> previousHandler = nil;
    for (id<ABI5_0_0RCTURLRequestHandler> handler in _handlers) {
      float priority = [handler respondsToSelector:@selector(handlerPriority)] ? [handler handlerPriority] : 0;
      if (previousHandler && priority < previousPriority) {
        return previousHandler;
      }
      if ([handler canHandleRequest:request]) {
        if (previousHandler) {
          if (priority == previousPriority) {
            ABI5_0_0RCTLogError(@"The ABI5_0_0RCTURLRequestHandlers %@ and %@ both reported that"
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
  for (id<ABI5_0_0RCTURLRequestHandler> handler in _handlers) {
    if ([handler canHandleRequest:request]) {
      return handler;
    }
  }
  return nil;
}

- (ABI5_0_0RCTURLRequestCancellationBlock)buildRequest:(NSDictionary<NSString *, id> *)query
                                 completionBlock:(void (^)(NSURLRequest *request))block
{
  ABI5_0_0RCTAssertThread(_methodQueue, @"buildRequest: must be called on method queue");

  NSURL *URL = [ABI5_0_0RCTConvert NSURL:query[@"url"]]; // this is marked as nullable in JS, but should not be null
  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:URL];
  request.HTTPMethod = [ABI5_0_0RCTConvert NSString:ABI5_0_0RCTNilIfNull(query[@"method"])].uppercaseString ?: @"GET";
  request.allHTTPHeaderFields = [ABI5_0_0RCTConvert NSDictionary:query[@"headers"]];
  request.timeoutInterval = [ABI5_0_0RCTConvert NSTimeInterval:query[@"timeout"]];
  NSDictionary<NSString *, id> *data = [ABI5_0_0RCTConvert NSDictionary:ABI5_0_0RCTNilIfNull(query[@"data"])];
  return [self processDataForHTTPQuery:data callback:^(NSError *error, NSDictionary<NSString *, id> *result) {
    if (error) {
      ABI5_0_0RCTLogError(@"Error processing request body: %@", error);
      // Ideally we'd circle back to JS here and notify an error/abort on the request.
      return (ABI5_0_0RCTURLRequestCancellationBlock)nil;
    }
    request.HTTPBody = result[@"body"];
    NSString *contentType = result[@"contentType"];
    if (contentType) {
      [request setValue:contentType forHTTPHeaderField:@"Content-Type"];
    }

    // Gzip the request body
    if ([request.allHTTPHeaderFields[@"Content-Encoding"] isEqualToString:@"gzip"]) {
      request.HTTPBody = ABI5_0_0RCTGzipData(request.HTTPBody, -1 /* default */);
      [request setValue:(@(request.HTTPBody.length)).description forHTTPHeaderField:@"Content-Length"];
    }

    dispatch_async(_methodQueue, ^{
      block(request);
    });

    return (ABI5_0_0RCTURLRequestCancellationBlock)nil;
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
- (ABI5_0_0RCTURLRequestCancellationBlock)processDataForHTTPQuery:(nullable NSDictionary<NSString *, id> *)query callback:
(ABI5_0_0RCTURLRequestCancellationBlock (^)(NSError *error, NSDictionary<NSString *, id> *result))callback
{
  ABI5_0_0RCTAssertThread(_methodQueue, @"processDataForHTTPQuery: must be called on method queue");

  if (!query) {
    return callback(nil, nil);
  }
  NSData *body = [ABI5_0_0RCTConvert NSData:query[@"string"]];
  if (body) {
    return callback(nil, @{@"body": body});
  }
  NSURLRequest *request = [ABI5_0_0RCTConvert NSURLRequest:query[@"uri"]];
  if (request) {

    __block ABI5_0_0RCTURLRequestCancellationBlock cancellationBlock = nil;
    ABI5_0_0RCTNetworkTask *task = [self networkTaskWithRequest:request completionBlock:^(NSURLResponse *response, NSData *data, NSError *error) {
      dispatch_async(_methodQueue, ^{
        cancellationBlock = callback(error, data ? @{@"body": data, @"contentType": ABI5_0_0RCTNullIfNil(response.MIMEType)} : nil);
      });
    }];

    [task start];

    __weak ABI5_0_0RCTNetworkTask *weakTask = task;
    return ^{
      [weakTask cancel];
      if (cancellationBlock) {
        cancellationBlock();
      }
    };
  }
  NSArray<NSDictionary *> *formData = [ABI5_0_0RCTConvert NSDictionaryArray:query[@"formData"]];
  if (formData) {
    ABI5_0_0RCTHTTPFormDataHelper *formDataHelper = [ABI5_0_0RCTHTTPFormDataHelper new];
    formDataHelper.networker = self;
    return [formDataHelper process:formData callback:callback];
  }
  // Nothing in the data payload, at least nothing we could understand anyway.
  // Ignore and treat it as if it were null.
  return callback(nil, nil);
}

- (void)sendData:(NSData *)data forTask:(ABI5_0_0RCTNetworkTask *)task
{
  ABI5_0_0RCTAssertThread(_methodQueue, @"sendData: must be called on method queue");

  if (data.length == 0) {
    return;
  }

  // Get text encoding
  NSURLResponse *response = task.response;
  NSStringEncoding encoding = NSUTF8StringEncoding;
  if (response.textEncodingName) {
    CFStringEncoding cfEncoding = CFStringConvertIANACharSetNameToEncoding((CFStringRef)response.textEncodingName);
    encoding = CFStringConvertEncodingToNSStringEncoding(cfEncoding);
  }

  // Attempt to decode text
  NSString *responseText = [[NSString alloc] initWithData:data encoding:encoding];
  if (!responseText && data.length) {

    // We don't have an encoding, or the encoding is incorrect, so now we
    // try to guess (unfortunately, this feature is available in iOS 8+ only)
    if ([NSString respondsToSelector:@selector(stringEncodingForData:
                                               encodingOptions:
                                               convertedString:
                                               usedLossyConversion:)]) {
      [NSString stringEncodingForData:data
                      encodingOptions:nil
                      convertedString:&responseText
                  usedLossyConversion:NULL];
    }

    // If we still can't decode it, bail out
    if (!responseText) {
      ABI5_0_0RCTLogWarn(@"Received data was not a string, or was not a recognised encoding.");
      return;
    }
  }

  NSArray<id> *responseJSON = @[task.requestID, responseText ?: @""];
  [_bridge.eventDispatcher sendDeviceEventWithName:@"didReceiveNetworkData"
                                              body:responseJSON];
}

- (void)sendRequest:(NSURLRequest *)request
 incrementalUpdates:(BOOL)incrementalUpdates
     responseSender:(ABI5_0_0RCTResponseSenderBlock)responseSender
{
  ABI5_0_0RCTAssertThread(_methodQueue, @"sendRequest: must be called on method queue");

  __block ABI5_0_0RCTNetworkTask *task;

  ABI5_0_0RCTURLRequestProgressBlock uploadProgressBlock = ^(int64_t progress, int64_t total) {
    dispatch_async(_methodQueue, ^{
      NSArray *responseJSON = @[task.requestID, @((double)progress), @((double)total)];
      [_bridge.eventDispatcher sendDeviceEventWithName:@"didSendNetworkData" body:responseJSON];
    });
  };

  void (^responseBlock)(NSURLResponse *) = ^(NSURLResponse *response) {
    dispatch_async(_methodQueue, ^{
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
      [_bridge.eventDispatcher sendDeviceEventWithName:@"didReceiveNetworkResponse"
                                                  body:responseJSON];
    });
  };

  void (^incrementalDataBlock)(NSData *) = incrementalUpdates ? ^(NSData *data) {
    dispatch_async(_methodQueue, ^{
      [self sendData:data forTask:task];
    });
  } : nil;

  ABI5_0_0RCTURLRequestCompletionBlock completionBlock =
  ^(NSURLResponse *response, NSData *data, NSError *error) {
    dispatch_async(_methodQueue, ^{
      if (!incrementalUpdates) {
        [self sendData:data forTask:task];
      }
      NSArray *responseJSON = @[task.requestID,
                                ABI5_0_0RCTNullIfNil(error.localizedDescription),
                                ];

      [_bridge.eventDispatcher sendDeviceEventWithName:@"didCompleteNetworkResponse"
                                                  body:responseJSON];

      [_tasksByRequestID removeObjectForKey:task.requestID];
    });
  };

  task = [self networkTaskWithRequest:request completionBlock:completionBlock];
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

- (ABI5_0_0RCTNetworkTask *)networkTaskWithRequest:(NSURLRequest *)request
                             completionBlock:(ABI5_0_0RCTURLRequestCompletionBlock)completionBlock
{
  id<ABI5_0_0RCTURLRequestHandler> handler = [self handlerForRequest:request];
  if (!handler) {
    ABI5_0_0RCTLogError(@"No suitable URL request handler found for %@", request.URL);
    return nil;
  }

  return [[ABI5_0_0RCTNetworkTask alloc] initWithRequest:request
                                          handler:handler
                                  completionBlock:completionBlock];
}

#pragma mark - JS API

ABI5_0_0RCT_EXPORT_METHOD(sendRequest:(NSDictionary *)query
                  responseSender:(ABI5_0_0RCTResponseSenderBlock)responseSender)
{
  // TODO: buildRequest returns a cancellation block, but there's currently
  // no way to invoke it, if, for example the request is cancelled while
  // loading a large file to build the request body
  [self buildRequest:query completionBlock:^(NSURLRequest *request) {

    BOOL incrementalUpdates = [ABI5_0_0RCTConvert BOOL:query[@"incrementalUpdates"]];
    [self sendRequest:request
   incrementalUpdates:incrementalUpdates
       responseSender:responseSender];
  }];
}

ABI5_0_0RCT_EXPORT_METHOD(cancelRequest:(nonnull NSNumber *)requestID)
{
  [_tasksByRequestID[requestID] cancel];
  [_tasksByRequestID removeObjectForKey:requestID];
}

@end

@implementation ABI5_0_0RCTBridge (ABI5_0_0RCTNetworking)

- (ABI5_0_0RCTNetworking *)networking
{
  return [self moduleForClass:[ABI5_0_0RCTNetworking class]];
}

@end

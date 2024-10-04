/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI42_0_0React/ABI42_0_0RCTBlobManager.h>

#import <mutex>

#import <ABI42_0_0FBReactNativeSpec/ABI42_0_0FBReactNativeSpec.h>
#import <ABI42_0_0React/ABI42_0_0RCTConvert.h>
#import <ABI42_0_0React/ABI42_0_0RCTNetworking.h>
#import <ABI42_0_0React/ABI42_0_0RCTUtils.h>
#import <ABI42_0_0React/ABI42_0_0RCTWebSocketModule.h>

#import "ABI42_0_0RCTBlobPlugins.h"
#import "ABI42_0_0RCTBlobCollector.h"

static NSString *const kBlobURIScheme = @"blob";

@interface ABI42_0_0RCTBlobManager () <ABI42_0_0RCTNetworkingRequestHandler, ABI42_0_0RCTNetworkingResponseHandler, ABI42_0_0RCTWebSocketContentHandler, ABI42_0_0NativeBlobModuleSpec>

@end

@implementation ABI42_0_0RCTBlobManager
{
  // Blobs should be thread safe since they are used from the websocket and networking module,
  // make sure to use proper locking when accessing this.
  NSMutableDictionary<NSString *, NSData *> *_blobs;
  std::mutex _blobsMutex;

  NSOperationQueue *_queue;
}

ABI42_0_0RCT_EXPORT_MODULE(BlobModule)

@synthesize bridge = _bridge;
@synthesize methodQueue = _methodQueue;
@synthesize turboModuleLookupDelegate = _turboModuleLookupDelegate;

- (void)setBridge:(ABI42_0_0RCTBridge *)bridge
{
  _bridge = bridge;

  std::lock_guard<std::mutex> lock(_blobsMutex);
  _blobs = [NSMutableDictionary new];

  ABI42_0_0facebook::ABI42_0_0React::ABI42_0_0RCTBlobCollector::install(self);
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (NSDictionary<NSString *, id> *)constantsToExport
{
  return [self getConstants];
}

- (NSDictionary<NSString *, id> *)getConstants
{
  return @{
    @"BLOB_URI_SCHEME": kBlobURIScheme,
    @"BLOB_URI_HOST": [NSNull null],
  };
}

- (NSString *)store:(NSData *)data
{
  NSString *blobId = [NSUUID UUID].UUIDString;
  [self store:data withId:blobId];
  return blobId;
}

- (void)store:(NSData *)data withId:(NSString *)blobId
{
  std::lock_guard<std::mutex> lock(_blobsMutex);
  _blobs[blobId] = data;
}

- (NSData *)resolve:(NSDictionary<NSString *, id> *)blob
{
  NSString *blobId = [ABI42_0_0RCTConvert NSString:blob[@"blobId"]];
  NSNumber *offset = [ABI42_0_0RCTConvert NSNumber:blob[@"offset"]];
  NSNumber *size = [ABI42_0_0RCTConvert NSNumber:blob[@"size"]];
  return [self resolve:blobId
                offset:offset ? [offset integerValue] : 0
                  size:size ? [size integerValue] : -1];
}

- (NSData *)resolve:(NSString *)blobId offset:(NSInteger)offset size:(NSInteger)size
{
  NSData *data;
  {
    std::lock_guard<std::mutex> lock(_blobsMutex);
    data = _blobs[blobId];
  }
  if (!data) {
    return nil;
  }
  if (offset != 0 || (size != -1 && size != data.length)) {
    data = [data subdataWithRange:NSMakeRange(offset, size)];
  }
  return data;
}

- (NSData *)resolveURL:(NSURL *)url
{
  NSURLComponents *components = [[NSURLComponents alloc] initWithURL:url resolvingAgainstBaseURL:NO];

  NSString *blobId = components.path;
  NSInteger offset = 0;
  NSInteger size = -1;

  if (components.queryItems) {
    for (NSURLQueryItem *queryItem in components.queryItems) {
      if ([queryItem.name isEqualToString:@"offset"]) {
        offset = [queryItem.value integerValue];
      }
      if ([queryItem.name isEqualToString:@"size"]) {
        size = [queryItem.value integerValue];
      }
    }
  }

  if (blobId) {
    return [self resolve:blobId offset:offset size:size];
  }
  return nil;
}

- (void)remove:(NSString *)blobId
{
  std::lock_guard<std::mutex> lock(_blobsMutex);
  [_blobs removeObjectForKey:blobId];
}

ABI42_0_0RCT_EXPORT_METHOD(addNetworkingHandler)
{
  ABI42_0_0RCTNetworking *const networking = _bridge ? _bridge.networking : [_turboModuleLookupDelegate moduleForName:"ABI42_0_0RCTNetworking"];

  // TODO(T63516227): Why can methodQueue be nil here? 
  // We don't want to do anything when methodQueue is nil.
  if (!networking.methodQueue) {
    return;
  }

  dispatch_async(networking.methodQueue, ^{
    [networking addRequestHandler:self];
    [networking addResponseHandler:self];
  });
}

ABI42_0_0RCT_EXPORT_METHOD(addWebSocketHandler:(double)socketID)
{
  dispatch_async(_bridge.webSocketModule.methodQueue, ^{
    [self->_bridge.webSocketModule setContentHandler:self forSocketID:[NSNumber numberWithDouble:socketID]];
  });
}

ABI42_0_0RCT_EXPORT_METHOD(removeWebSocketHandler:(double)socketID)
{
  dispatch_async(_bridge.webSocketModule.methodQueue, ^{
    [self->_bridge.webSocketModule setContentHandler:nil forSocketID:[NSNumber numberWithDouble:socketID]];
  });
}

// @lint-ignore FBOBJCUNTYPEDCOLLECTION1
ABI42_0_0RCT_EXPORT_METHOD(sendOverSocket:(NSDictionary *)blob socketID:(double)socketID)
{
  dispatch_async(_bridge.webSocketModule.methodQueue, ^{
    [self->_bridge.webSocketModule sendData:[self resolve:blob] forSocketID:[NSNumber numberWithDouble:socketID]];
  });
}

ABI42_0_0RCT_EXPORT_METHOD(createFromParts:(NSArray<NSDictionary<NSString *, id> *> *)parts withId:(NSString *)blobId)
{
  NSMutableData *data = [NSMutableData new];
  for (NSDictionary<NSString *, id> *part in parts) {
    NSString *type = [ABI42_0_0RCTConvert NSString:part[@"type"]];

    if ([type isEqualToString:@"blob"]) {
      NSData *partData = [self resolve:part[@"data"]];
      [data appendData:partData];
    } else if ([type isEqualToString:@"string"]) {
      NSData *partData = [[ABI42_0_0RCTConvert NSString:part[@"data"]] dataUsingEncoding:NSUTF8StringEncoding];
      [data appendData:partData];
    } else {
      [NSException raise:@"Invalid type for blob" format:@"%@ is invalid", type];
    }
  }
  [self store:data withId:blobId];
}

ABI42_0_0RCT_EXPORT_METHOD(release:(NSString *)blobId)
{
  [self remove:blobId];
}

#pragma mark - ABI42_0_0RCTURLRequestHandler methods

- (BOOL)canHandleRequest:(NSURLRequest *)request
{
  return [request.URL.scheme caseInsensitiveCompare:kBlobURIScheme] == NSOrderedSame;
}

- (id)sendRequest:(NSURLRequest *)request withDelegate:(id<ABI42_0_0RCTURLRequestDelegate>)delegate
{
  // Lazy setup
  if (!_queue) {
    _queue = [NSOperationQueue new];
    _queue.maxConcurrentOperationCount = 2;
  }

  __weak __typeof(self) weakSelf = self;
  __weak __block NSBlockOperation *weakOp;
  __block NSBlockOperation *op = [NSBlockOperation blockOperationWithBlock:^{
    __typeof(self) strongSelf = weakSelf;
    if (!strongSelf) {
      return;
    }
    NSURLResponse *response = [[NSURLResponse alloc] initWithURL:request.URL
                                                        MIMEType:nil
                                           expectedContentLength:-1
                                                textEncodingName:nil];

    [delegate URLRequest:weakOp didReceiveResponse:response];

    NSData *data = [strongSelf resolveURL:response.URL];
    NSError *error;
    if (data) {
      [delegate URLRequest:weakOp didReceiveData:data];
    } else {
      error = [[NSError alloc] initWithDomain:NSURLErrorDomain code:NSURLErrorBadURL userInfo:nil];
    }
    [delegate URLRequest:weakOp didCompleteWithError:error];
  }];

  weakOp = op;
  [_queue addOperation:op];
  return op;
}

- (void)cancelRequest:(NSOperation *)op
{
  [op cancel];
}

#pragma mark - ABI42_0_0RCTNetworkingRequestHandler methods

// @lint-ignore FBOBJCUNTYPEDCOLLECTION1
- (BOOL)canHandleNetworkingRequest:(NSDictionary *)data
{
  return data[@"blob"] != nil;
}

// @lint-ignore FBOBJCUNTYPEDCOLLECTION1
- (NSDictionary *)handleNetworkingRequest:(NSDictionary *)data
{
  // @lint-ignore FBOBJCUNTYPEDCOLLECTION1
  NSDictionary *blob = [ABI42_0_0RCTConvert NSDictionary:data[@"blob"]];

  NSString *contentType = @"application/octet-stream";
  NSString *blobType = [ABI42_0_0RCTConvert NSString:blob[@"type"]];
  if (blobType != nil && blobType.length > 0) {
    contentType = blob[@"type"];
  }

  return @{@"body": [self resolve:blob], @"contentType": contentType};
}

- (BOOL)canHandleNetworkingResponse:(NSString *)responseType
{
  return [responseType isEqualToString:@"blob"];
}

- (id)handleNetworkingResponse:(NSURLResponse *)response data:(NSData *)data
{
  // An empty body will have nil for data, in this case we need to return
  // an empty blob as per the XMLHttpRequest spec.
  data = data ?: [NSData new];
  return @{
    @"blobId": [self store:data],
    @"offset": @0,
    @"size": @(data.length),
    @"name": ABI42_0_0RCTNullIfNil([response suggestedFilename]),
    @"type": ABI42_0_0RCTNullIfNil([response MIMEType]),
  };
}

#pragma mark - ABI42_0_0RCTWebSocketContentHandler methods

- (id)processWebsocketMessage:(id)message
                  forSocketID:(NSNumber *)socketID
                     withType:(NSString *__autoreleasing _Nonnull *)type
{
  if (![message isKindOfClass:[NSData class]]) {
    *type = @"text";
    return message;
  }

  *type = @"blob";
  return @{
    @"blobId": [self store:message],
    @"offset": @0,
    @"size": @(((NSData *)message).length),
  };
}

- (std::shared_ptr<ABI42_0_0facebook::ABI42_0_0React::TurboModule>)
    getTurboModuleWithJsInvoker:(std::shared_ptr<ABI42_0_0facebook::ABI42_0_0React::CallInvoker>)jsInvoker
                  nativeInvoker:(std::shared_ptr<ABI42_0_0facebook::ABI42_0_0React::CallInvoker>)nativeInvoker
                     perfLogger:(id<ABI42_0_0RCTTurboModulePerformanceLogger>)perfLogger
{
  return std::make_shared<ABI42_0_0facebook::ABI42_0_0React::NativeBlobModuleSpecJSI>(self, jsInvoker, nativeInvoker, perfLogger);
}

@end

Class ABI42_0_0RCTBlobManagerCls(void) {
  return ABI42_0_0RCTBlobManager.class;
}

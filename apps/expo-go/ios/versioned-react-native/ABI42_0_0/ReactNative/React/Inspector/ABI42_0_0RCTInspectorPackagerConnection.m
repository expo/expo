/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI42_0_0React/ABI42_0_0RCTInspectorPackagerConnection.h>

#if ABI42_0_0RCT_DEV

#import <ABI42_0_0React/ABI42_0_0RCTDefines.h>
#import <ABI42_0_0React/ABI42_0_0RCTInspector.h>
#import <ABI42_0_0React/ABI42_0_0RCTLog.h>
#import <ABI42_0_0React/ABI42_0_0RCTSRWebSocket.h>
#import <ABI42_0_0React/ABI42_0_0RCTUtils.h>

// This is a port of the Android impl, at
// ABI42_0_0ReactAndroid/src/main/java/com/facebook/ABI42_0_0React/devsupport/InspectorPackagerConnection.java
// please keep consistent :)

const int ABI42_0_0RECONNECT_DELAY_MS = 2000;

@implementation ABI42_0_0RCTBundleStatus
@end

@interface ABI42_0_0RCTInspectorPackagerConnection () <ABI42_0_0RCTSRWebSocketDelegate> {
  NSURL *_url;
  NSMutableDictionary<NSString *, ABI42_0_0RCTInspectorLocalConnection *> *_inspectorConnections;
  ABI42_0_0RCTSRWebSocket *_webSocket;
  dispatch_queue_t _jsQueue;
  BOOL _closed;
  BOOL _suppressConnectionErrors;
  ABI42_0_0RCTBundleStatusProvider _bundleStatusProvider;
}
@end

@interface ABI42_0_0RCTInspectorRemoteConnection () {
  __weak ABI42_0_0RCTInspectorPackagerConnection *_owningPackagerConnection;
  NSString *_pageId;
}
- (instancetype)initWithPackagerConnection:(ABI42_0_0RCTInspectorPackagerConnection *)owningPackagerConnection
                                    pageId:(NSString *)pageId;
@end

static NSDictionary<NSString *, id> *makePageIdPayload(NSString *pageId)
{
  return @{@"pageId" : pageId};
}

@implementation ABI42_0_0RCTInspectorPackagerConnection

ABI42_0_0RCT_NOT_IMPLEMENTED(-(instancetype)init)

- (instancetype)initWithURL:(NSURL *)url
{
  if (self = [super init]) {
    _url = url;
    _inspectorConnections = [NSMutableDictionary new];
    _jsQueue = dispatch_queue_create("com.facebook.ABI42_0_0React.WebSocketExecutor", DISPATCH_QUEUE_SERIAL);
  }
  return self;
}

- (void)setBundleStatusProvider:(ABI42_0_0RCTBundleStatusProvider)bundleStatusProvider
{
  _bundleStatusProvider = bundleStatusProvider;
}

- (void)handleProxyMessage:(NSDictionary<NSString *, id> *)message
{
  NSString *event = message[@"event"];
  NSDictionary *payload = message[@"payload"];
  if ([@"getPages" isEqualToString:event]) {
    [self sendEvent:event payload:[self pages]];
  } else if ([@"wrappedEvent" isEqualToString:event]) {
    [self handleWrappedEvent:payload];
  } else if ([@"connect" isEqualToString:event]) {
    [self handleConnect:payload];
  } else if ([@"disconnect" isEqualToString:event]) {
    [self handleDisconnect:payload];
  } else {
    ABI42_0_0RCTLogError(@"Unknown event: %@", event);
  }
}

- (void)sendEventToAllConnections:(NSString *)event
{
  for (NSString *pageId in _inspectorConnections) {
    [_inspectorConnections[pageId] sendMessage:event];
  }
}

- (void)closeAllConnections
{
  for (NSString *pageId in _inspectorConnections) {
    [[_inspectorConnections objectForKey:pageId] disconnect];
  }
  [_inspectorConnections removeAllObjects];
}

- (void)handleConnect:(NSDictionary *)payload
{
  NSString *pageId = payload[@"pageId"];
  ABI42_0_0RCTInspectorLocalConnection *existingConnection = _inspectorConnections[pageId];
  if (existingConnection) {
    [_inspectorConnections removeObjectForKey:pageId];
    [existingConnection disconnect];
    ABI42_0_0RCTLogWarn(@"Already connected: %@", pageId);
    return;
  }

  ABI42_0_0RCTInspectorRemoteConnection *remoteConnection =
      [[ABI42_0_0RCTInspectorRemoteConnection alloc] initWithPackagerConnection:self pageId:pageId];

  ABI42_0_0RCTInspectorLocalConnection *inspectorConnection = [ABI42_0_0RCTInspector connectPage:[pageId integerValue]
                                                           forRemoteConnection:remoteConnection];
  _inspectorConnections[pageId] = inspectorConnection;
}

- (void)handleDisconnect:(NSDictionary *)payload
{
  NSString *pageId = payload[@"pageId"];
  ABI42_0_0RCTInspectorLocalConnection *inspectorConnection = _inspectorConnections[pageId];
  if (inspectorConnection) {
    [self removeConnectionForPage:pageId];
    [inspectorConnection disconnect];
  }
}

- (void)removeConnectionForPage:(NSString *)pageId
{
  [_inspectorConnections removeObjectForKey:pageId];
}

- (void)handleWrappedEvent:(NSDictionary *)payload
{
  NSString *pageId = payload[@"pageId"];
  NSString *wrappedEvent = payload[@"wrappedEvent"];
  ABI42_0_0RCTInspectorLocalConnection *inspectorConnection = _inspectorConnections[pageId];
  if (!inspectorConnection) {
    ABI42_0_0RCTLogWarn(@"Not connected to page: %@ , failed trying to handle event: %@", pageId, wrappedEvent);
    return;
  }
  [inspectorConnection sendMessage:wrappedEvent];
}

- (NSArray *)pages
{
  NSArray<ABI42_0_0RCTInspectorPage *> *pages = [ABI42_0_0RCTInspector pages];
  NSMutableArray *array = [NSMutableArray arrayWithCapacity:pages.count];

  ABI42_0_0RCTBundleStatusProvider statusProvider = _bundleStatusProvider;
  ABI42_0_0RCTBundleStatus *bundleStatus = statusProvider == nil ? nil : statusProvider();

  for (ABI42_0_0RCTInspectorPage *page in pages) {
    NSDictionary *jsonPage = @{
      @"id" : [@(page.id) stringValue],
      @"title" : page.title,
      @"app" : [[NSBundle mainBundle] bundleIdentifier],
      @"vm" : page.vm,
      @"isLastBundleDownloadSuccess" : bundleStatus == nil ? [NSNull null]
                                                           : @(bundleStatus.isLastBundleDownloadSuccess),
      @"bundleUpdateTimestamp" : bundleStatus == nil ? [NSNull null]
                                                     : @((long)bundleStatus.bundleUpdateTimestamp * 1000),
    };
    [array addObject:jsonPage];
  }
  return array;
}

- (void)sendWrappedEvent:(NSString *)pageId message:(NSString *)message
{
  NSDictionary *payload = @{
    @"pageId" : pageId,
    @"wrappedEvent" : message,
  };
  [self sendEvent:@"wrappedEvent" payload:payload];
}

- (void)sendEvent:(NSString *)name payload:(id)payload
{
  NSDictionary *jsonMessage = @{
    @"event" : name,
    @"payload" : payload,
  };
  [self sendToPackager:jsonMessage];
}

// analogous to InspectorPackagerConnection.Connection.onFailure(...)
- (void)webSocket:(__unused ABI42_0_0RCTSRWebSocket *)webSocket didFailWithError:(NSError *)error
{
  if (_webSocket) {
    [self abort:@"Websocket exception" withCause:error];
  }
  if (!_closed && [error code] != ECONNREFUSED) {
    [self reconnect];
  }
}

// analogous to InspectorPackagerConnection.Connection.onMessage(...)
- (void)webSocket:(__unused ABI42_0_0RCTSRWebSocket *)webSocket didReceiveMessage:(id)opaqueMessage
{
  // warn but don't die on unrecognized messages
  if (![opaqueMessage isKindOfClass:[NSString class]]) {
    ABI42_0_0RCTLogWarn(@"Unrecognized inspector message, object is of type: %@", [opaqueMessage class]);
    return;
  }

  NSString *messageText = opaqueMessage;
  NSError *error = nil;
  id parsedJSON = ABI42_0_0RCTJSONParse(messageText, &error);
  if (error) {
    ABI42_0_0RCTLogWarn(@"Unrecognized inspector message, string was not valid JSON: %@", messageText);
    return;
  }

  [self handleProxyMessage:parsedJSON];
}

// analogous to InspectorPackagerConnection.Connection.onClosed(...)
- (void)webSocket:(__unused ABI42_0_0RCTSRWebSocket *)webSocket
    didCloseWithCode:(__unused NSInteger)code
              reason:(__unused NSString *)reason
            wasClean:(__unused BOOL)wasClean
{
  _webSocket = nil;
  [self closeAllConnections];
  if (!_closed) {
    [self reconnect];
  }
}

- (bool)isConnected
{
  return _webSocket != nil;
}

- (void)connect
{
  if (_closed) {
    ABI42_0_0RCTLogError(@"Illegal state: Can't connect after having previously been closed.");
    return;
  }

  // The corresponding android code has a lot of custom config options for
  // timeouts, but it appears the iOS ABI42_0_0RCTSRWebSocket API doesn't have the same
  // implemented options.
  _webSocket = [[ABI42_0_0RCTSRWebSocket alloc] initWithURL:_url];
  [_webSocket setDelegateDispatchQueue:_jsQueue];
  _webSocket.delegate = self;
  [_webSocket open];
}

- (void)reconnect
{
  if (_closed) {
    ABI42_0_0RCTLogError(@"Illegal state: Can't reconnect after having previously been closed.");
    return;
  }

  if (_suppressConnectionErrors) {
    ABI42_0_0RCTLogWarn(@"Couldn't connect to packager, will silently retry");
    _suppressConnectionErrors = true;
  }

  __weak ABI42_0_0RCTInspectorPackagerConnection *weakSelf = self;
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, ABI42_0_0RECONNECT_DELAY_MS * NSEC_PER_MSEC), dispatch_get_main_queue(), ^{
    ABI42_0_0RCTInspectorPackagerConnection *strongSelf = weakSelf;
    if (strongSelf && !strongSelf->_closed) {
      [strongSelf connect];
    }
  });
}

- (void)closeQuietly
{
  _closed = true;
  [self disposeWebSocket];
}

- (void)sendToPackager:(NSDictionary *)messageObject
{
  __weak ABI42_0_0RCTInspectorPackagerConnection *weakSelf = self;
  dispatch_async(_jsQueue, ^{
    ABI42_0_0RCTInspectorPackagerConnection *strongSelf = weakSelf;
    if (strongSelf && !strongSelf->_closed) {
      NSError *error;
      NSString *messageText = ABI42_0_0RCTJSONStringify(messageObject, &error);
      if (error) {
        ABI42_0_0RCTLogWarn(@"Couldn't send event to packager: %@", error);
      } else {
        [strongSelf->_webSocket send:messageText];
      }
    }
  });
}

- (void)abort:(NSString *)message withCause:(NSError *)cause
{
  // Don't log ECONNREFUSED at all; it's expected in cases where the server isn't listening.
  if (![cause.domain isEqual:NSPOSIXErrorDomain] || cause.code != ECONNREFUSED) {
    ABI42_0_0RCTLogInfo(@"Error occurred, shutting down websocket connection: %@ %@", message, cause);
  }

  [self closeAllConnections];
  [self disposeWebSocket];
}

- (void)disposeWebSocket
{
  if (_webSocket) {
    [_webSocket closeWithCode:1000 reason:@"End of session"];
    _webSocket.delegate = nil;
    _webSocket = nil;
  }
}

@end

@implementation ABI42_0_0RCTInspectorRemoteConnection

ABI42_0_0RCT_NOT_IMPLEMENTED(-(instancetype)init)

- (instancetype)initWithPackagerConnection:(ABI42_0_0RCTInspectorPackagerConnection *)owningPackagerConnection
                                    pageId:(NSString *)pageId
{
  if (self = [super init]) {
    _owningPackagerConnection = owningPackagerConnection;
    _pageId = pageId;
  }
  return self;
}

- (void)onMessage:(NSString *)message
{
  [_owningPackagerConnection sendWrappedEvent:_pageId message:message];
}

- (void)onDisconnect
{
  ABI42_0_0RCTInspectorPackagerConnection *owningPackagerConnectionStrong = _owningPackagerConnection;
  if (owningPackagerConnectionStrong) {
    [owningPackagerConnectionStrong removeConnectionForPage:_pageId];
    [owningPackagerConnectionStrong sendEvent:@"disconnect" payload:makePageIdPayload(_pageId)];
  }
}

@end

#endif

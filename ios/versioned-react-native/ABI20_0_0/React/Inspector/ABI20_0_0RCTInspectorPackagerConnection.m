#import "ABI20_0_0RCTInspectorPackagerConnection.h"

#if ABI20_0_0RCT_DEV

#import "ABI20_0_0RCTDefines.h"
#import "ABI20_0_0RCTInspector.h"
#import "ABI20_0_0RCTLog.h"
#import "ABI20_0_0RCTSRWebSocket.h"
#import "ABI20_0_0RCTUtils.h"

// This is a port of the Android impl, at
// ReactABI20_0_0Android/src/main/java/com/facebook/ReactABI20_0_0/devsupport/InspectorPackagerConnection.java
// please keep consistent :)

const int RECONNECT_DELAY_MS = 2000;

@interface ABI20_0_0RCTInspectorPackagerConnection () <ABI20_0_0RCTSRWebSocketDelegate> {
  NSURL *_url;
  NSMutableDictionary<NSString *, ABI20_0_0RCTInspectorLocalConnection *> *_inspectorConnections;
  ABI20_0_0RCTSRWebSocket *_webSocket;
  BOOL _closed;
  BOOL _suppressConnectionErrors;
}
@end

@interface ABI20_0_0RCTInspectorRemoteConnection () {
  __weak ABI20_0_0RCTInspectorPackagerConnection *_owningPackagerConnection;
  NSString *_pageId;
}
- (instancetype)initWithPackagerConnection:(ABI20_0_0RCTInspectorPackagerConnection *)owningPackagerConnection
                                    pageId:(NSString *)pageId;
@end

static NSDictionary<NSString *, id> *makePageIdPayload(NSString *pageId)
{
  return @{ @"pageId": pageId };
}

@implementation ABI20_0_0RCTInspectorPackagerConnection

ABI20_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (instancetype)initWithURL:(NSURL *)url
{
  if (self = [super init]) {
    _url = url;
    _inspectorConnections = [NSMutableDictionary new];
  }
  return self;
}

- (void)sendOpenEvent:(NSString *)pageId
{
  NSDictionary<NSString *, id> *payload = makePageIdPayload(pageId);
  [self sendEvent:@"open" payload:payload];
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
    ABI20_0_0RCTLogError(@"Unknown event: %@", event);
  }
}

- (void)closeAllConnections
{
  for (NSString *pageId in _inspectorConnections){
    [[_inspectorConnections objectForKey:pageId] disconnect];
  }
  [_inspectorConnections removeAllObjects];
}

- (void)handleConnect:(NSDictionary *)payload
{
  NSString *pageId = payload[@"pageId"];
  if (_inspectorConnections[pageId]) {
    [_inspectorConnections removeObjectForKey:pageId];
    ABI20_0_0RCTLogError(@"Already connected: %@", pageId);
    return;
  }

  ABI20_0_0RCTInspectorRemoteConnection *remoteConnection =
    [[ABI20_0_0RCTInspectorRemoteConnection alloc] initWithPackagerConnection:self
                                                              pageId:pageId];

  ABI20_0_0RCTInspectorLocalConnection *inspectorConnection = [ABI20_0_0RCTInspector connectPage:[pageId integerValue]
                                                           forRemoteConnection:remoteConnection];
  _inspectorConnections[pageId] = inspectorConnection;
}

- (void)handleDisconnect:(NSDictionary *)payload
{
  NSString *pageId = payload[@"pageId"];
  ABI20_0_0RCTInspectorLocalConnection *inspectorConnection = _inspectorConnections[pageId];
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
  ABI20_0_0RCTInspectorLocalConnection *inspectorConnection = _inspectorConnections[pageId];
  if (!inspectorConnection) {
    ABI20_0_0RCTLogError(@"Not connected: %@", pageId);
    return;
  }
  [inspectorConnection sendMessage:wrappedEvent];
}

- (NSArray *)pages
{
  NSArray<ABI20_0_0RCTInspectorPage *> *pages = [ABI20_0_0RCTInspector pages];
  NSMutableArray *array = [NSMutableArray arrayWithCapacity:pages.count];
  for (ABI20_0_0RCTInspectorPage *page in pages) {
    NSDictionary *jsonPage = @{
      @"id": [@(page.id) stringValue],
      @"title": page.title,
    };
    [array addObject:jsonPage];
  }
  return array;
}

- (void)sendWrappedEvent:(NSString *)pageId
                 message:(NSString *)message
{
  NSDictionary *payload = @{
    @"pageId": pageId,
    @"wrappedEvent": message,
  };
  [self sendEvent:@"wrappedEvent" payload:payload];
}

- (void)sendEvent:(NSString *)name payload:(id)payload
{
  NSDictionary *jsonMessage = @{
    @"event": name,
    @"payload": payload,
  };
  [self sendToPackager:jsonMessage];
}

// analogous to InspectorPackagerConnection.Connection.onFailure(...)
- (void)webSocket:(ABI20_0_0RCTSRWebSocket *)webSocket didFailWithError:(NSError *)error
{
  if (_webSocket) {
    [self abort:@"Websocket exception"
      withCause:error];
  }
  if (!_closed) {
    [self reconnect];
  }
}

// analogous to InspectorPackagerConnection.Connection.onMessage(...)
- (void)webSocket:(ABI20_0_0RCTSRWebSocket *)webSocket didReceiveMessage:(id)opaqueMessage
{
  // warn but don't die on unrecognized messages
  if (![opaqueMessage isKindOfClass:[NSString class]]) {
    ABI20_0_0RCTLogWarn(@"Unrecognized inspector message, object is of type: %@", [opaqueMessage class]);
    return;
  }

  NSString *messageText = opaqueMessage;
  NSError *error = nil;
  id parsedJSON = ABI20_0_0RCTJSONParse(messageText, &error);
  if (error) {
    ABI20_0_0RCTLogWarn(@"Unrecognized inspector message, string was not valid JSON: %@",
      messageText);
    return;
  }

  [self handleProxyMessage:parsedJSON];
}

// analogous to InspectorPackagerConnection.Connection.onClosed(...)
- (void)webSocket:(ABI20_0_0RCTSRWebSocket *)webSocket didCloseWithCode:(NSInteger)code
                                                        reason:(NSString *)reason
                                                      wasClean:(BOOL)wasClean
{
  _webSocket = nil;
  [self closeAllConnections];
  if (!_closed) {
    [self reconnect];
  }
}

- (void)connect
{
  if (_closed) {
    ABI20_0_0RCTLogError(@"Illegal state: Can't connect after having previously been closed.");
    return;
  }

  // The corresopnding android code has a lot of custom config options for
  // timeouts, but it appears the iOS ABI20_0_0RCTSRWebSocket API doesn't have the same
  // implemented options.
  _webSocket = [[ABI20_0_0RCTSRWebSocket alloc] initWithURL:_url];
  _webSocket.delegate = self;
  [_webSocket open];
}

- (void)reconnect
{
  if (_closed) {
    ABI20_0_0RCTLogError(@"Illegal state: Can't reconnect after having previously been closed.");
    return;
  }

  if (_suppressConnectionErrors) {
    ABI20_0_0RCTLogWarn(@"Couldn't connect to packager, will silently retry");
    _suppressConnectionErrors = true;
  }

  __weak ABI20_0_0RCTInspectorPackagerConnection *weakSelf = self;
  dispatch_after(
    dispatch_time(DISPATCH_TIME_NOW, RECONNECT_DELAY_MS *NSEC_PER_MSEC),
    dispatch_get_main_queue(), ^{
      ABI20_0_0RCTInspectorPackagerConnection *strongSelf = weakSelf;
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
  __weak ABI20_0_0RCTInspectorPackagerConnection *weakSelf = self;
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    ABI20_0_0RCTInspectorPackagerConnection *strongSelf = weakSelf;
    if (strongSelf && !strongSelf->_closed) {
      NSError *error;
      NSString *messageText = ABI20_0_0RCTJSONStringify(messageObject, &error);
      if (error) {
        ABI20_0_0RCTLogWarn(@"Couldn't send event to packager: %@", error);
      } else {
        [strongSelf->_webSocket send:messageText];
      }
    }
  });
}

- (void)abort:(NSString *)message
    withCause:(NSError *)cause
{
  ABI20_0_0RCTLogWarn(@"Error occurred, shutting down websocket connection: %@ %@", message, cause);

  [self closeAllConnections];
  [self disposeWebSocket];
}

- (void)disposeWebSocket
{
  if (_webSocket) {
    [_webSocket closeWithCode:1000
                       reason:@"End of session"];
    _webSocket.delegate = nil;
    _webSocket = nil;
  }
}

@end

@implementation ABI20_0_0RCTInspectorRemoteConnection

ABI20_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (instancetype)initWithPackagerConnection:(ABI20_0_0RCTInspectorPackagerConnection *)owningPackagerConnection
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
  [_owningPackagerConnection sendWrappedEvent:_pageId
                                      message:message];
}

- (void)onDisconnect
{
  ABI20_0_0RCTInspectorPackagerConnection *owningPackagerConnectionStrong = _owningPackagerConnection;
  if (owningPackagerConnectionStrong) {
    [owningPackagerConnectionStrong removeConnectionForPage:_pageId];
    [owningPackagerConnectionStrong sendEvent:@"disconnect"
                                      payload:makePageIdPayload(_pageId)];
  }
}

@end

#endif

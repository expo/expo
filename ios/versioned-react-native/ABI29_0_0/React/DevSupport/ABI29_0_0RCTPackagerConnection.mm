/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI29_0_0RCTPackagerConnection.h"

#import <algorithm>
#import <objc/runtime.h>
#import <vector>

#import <ReactABI29_0_0/ABI29_0_0RCTAssert.h>
#import <ReactABI29_0_0/ABI29_0_0RCTBridge.h>
#import <ReactABI29_0_0/ABI29_0_0RCTBundleURLProvider.h>
#import <ReactABI29_0_0/ABI29_0_0RCTConvert.h>
#import <ReactABI29_0_0/ABI29_0_0RCTDefines.h>
#import <ReactABI29_0_0/ABI29_0_0RCTLog.h>
#import <ReactABI29_0_0/ABI29_0_0RCTPackagerClient.h>
#import <ReactABI29_0_0/ABI29_0_0RCTReconnectingWebSocket.h>
#import <ReactABI29_0_0/ABI29_0_0RCTSRWebSocket.h>
#import <ReactABI29_0_0/ABI29_0_0RCTUtils.h>

#if ABI29_0_0RCT_DEV
@interface ABI29_0_0RCTPackagerConnection () <ABI29_0_0RCTReconnectingWebSocketDelegate>
@end

template <typename Handler>
struct Registration {
  NSString *method;
  Handler handler;
  dispatch_queue_t queue;
  uint32_t token;
};

@implementation ABI29_0_0RCTPackagerConnection {
  std::mutex _mutex; // protects all ivars
  ABI29_0_0RCTReconnectingWebSocket *_socket;
  BOOL _socketConnected;
  NSString *_jsLocationForSocket;
  id _bundleURLChangeObserver;
  uint32_t _nextToken;
  std::vector<Registration<ABI29_0_0RCTNotificationHandler>> _notificationRegistrations;
  std::vector<Registration<ABI29_0_0RCTRequestHandler>> _requestRegistrations;
  std::vector<Registration<ABI29_0_0RCTConnectedHandler>> _connectedRegistrations;
}

+ (instancetype)sharedPackagerConnection
{
  static ABI29_0_0RCTPackagerConnection *connection;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    connection = [ABI29_0_0RCTPackagerConnection new];
  });
  return connection;
}

- (instancetype)init
{
  if (self = [super init]) {
    _nextToken = 1; // Prevent randomly erasing a handler if you pass a bogus 0 token
    _jsLocationForSocket = [ABI29_0_0RCTBundleURLProvider sharedSettings].jsLocation;
    _socket = socketForLocation(_jsLocationForSocket);
    _socket.delegate = self;
    [_socket start];

    ABI29_0_0RCTPackagerConnection *const __weak weakSelf = self;
    _bundleURLChangeObserver =
    [[NSNotificationCenter defaultCenter]
     addObserverForName:ABI29_0_0RCTBundleURLProviderUpdatedNotification
     object:nil
     queue:[NSOperationQueue mainQueue]
     usingBlock:^(NSNotification *_Nonnull note) {
       [weakSelf bundleURLSettingsChanged];
     }];
  }
  return self;
}

static ABI29_0_0RCTReconnectingWebSocket *socketForLocation(NSString *const jsLocation)
{
  NSURLComponents *const components = [NSURLComponents new];
  components.host = jsLocation ?: @"localhost";
  components.scheme = @"http";
  components.port = @(kABI29_0_0RCTBundleURLProviderDefaultPort);
  components.path = @"/message";
  components.queryItems = @[[NSURLQueryItem queryItemWithName:@"role" value:@"ios"]];
  static dispatch_queue_t queue;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    queue = dispatch_queue_create("com.facebook.ABI29_0_0RCTPackagerConnectionQueue", DISPATCH_QUEUE_SERIAL);
  });
  return [[ABI29_0_0RCTReconnectingWebSocket alloc] initWithURL:components.URL queue:queue];
}

- (void)stop
{
  std::lock_guard<std::mutex> l(_mutex);
  if (_socket == nil) {
    // Already stopped
    return;
  }
  [[NSNotificationCenter defaultCenter] removeObserver:_bundleURLChangeObserver];
  _bundleURLChangeObserver = nil;
  _socketConnected = NO;
  [_socket stop];
  _socket = nil;
  _notificationRegistrations.clear();
  _requestRegistrations.clear();
}

- (void)bundleURLSettingsChanged
{
  std::lock_guard<std::mutex> l(_mutex);
  if (_socket == nil) {
    return; // already stopped
  }

  NSString *const jsLocation = [ABI29_0_0RCTBundleURLProvider sharedSettings].jsLocation;
  if ([jsLocation isEqual:_jsLocationForSocket]) {
    return; // unchanged
  }

  _socket.delegate = nil;
  [_socket stop];
  _jsLocationForSocket = jsLocation;
  _socket = socketForLocation(jsLocation);
  _socket.delegate = self;
  [_socket start];
}

- (ABI29_0_0RCTHandlerToken)addNotificationHandler:(ABI29_0_0RCTNotificationHandler)handler queue:(dispatch_queue_t)queue forMethod:(NSString *)method
{
  std::lock_guard<std::mutex> l(_mutex);
  const auto token = _nextToken++;
  _notificationRegistrations.push_back({method, handler, queue, token});
  return token;
}

- (ABI29_0_0RCTHandlerToken)addRequestHandler:(ABI29_0_0RCTRequestHandler)handler queue:(dispatch_queue_t)queue forMethod:(NSString *)method
{
  std::lock_guard<std::mutex> l(_mutex);
  const auto token = _nextToken++;
  _requestRegistrations.push_back({method, handler, queue, token});
  return token;
}

- (ABI29_0_0RCTHandlerToken)addConnectedHandler:(ABI29_0_0RCTConnectedHandler)handler queue:(dispatch_queue_t)queue
{
  std::lock_guard<std::mutex> l(_mutex);
  if (_socketConnected) {
    dispatch_async(queue, ^{
      handler();
    });
    return 0; // _nextToken starts at 1, so 0 is a no-op token
  } else {
    const auto token = _nextToken++;
    _connectedRegistrations.push_back({nil, handler, queue, token});
    return token;
  }
}

- (void)removeHandler:(ABI29_0_0RCTHandlerToken)token
{
  std::lock_guard<std::mutex> l(_mutex);
  eraseRegistrationsWithToken(_notificationRegistrations, token);
  eraseRegistrationsWithToken(_requestRegistrations, token);
  eraseRegistrationsWithToken(_connectedRegistrations, token);
}

template <typename Handler>
static void eraseRegistrationsWithToken(std::vector<Registration<Handler>> &registrations, ABI29_0_0RCTHandlerToken token)
{
  registrations.erase(std::remove_if(registrations.begin(), registrations.end(),
                                     [&token](const auto &reg) { return reg.token == token; }),
                      registrations.end());
}

- (void)addHandler:(id<ABI29_0_0RCTPackagerClientMethod>)handler forMethod:(NSString *)method
{
  dispatch_queue_t queue = [handler respondsToSelector:@selector(methodQueue)]
  ? [handler methodQueue] : dispatch_get_main_queue();

  [self addNotificationHandler:^(NSDictionary<NSString *, id> *notification) {
    [handler handleNotification:notification];
  } queue:queue forMethod:method];
  [self addRequestHandler:^(NSDictionary<NSString *, id> *request, ABI29_0_0RCTPackagerClientResponder *responder) {
    [handler handleRequest:request withResponder:responder];
  } queue:queue forMethod:method];
}

static BOOL isSupportedVersion(NSNumber *version)
{
  NSArray<NSNumber *> *const kSupportedVersions = @[ @(ABI29_0_0RCT_PACKAGER_CLIENT_PROTOCOL_VERSION) ];
  return [kSupportedVersions containsObject:version];
}

#pragma mark - ABI29_0_0RCTReconnectingWebSocketDelegate

- (void)reconnectingWebSocketDidOpen:(ABI29_0_0RCTReconnectingWebSocket *)webSocket
{
  std::vector<Registration<ABI29_0_0RCTConnectedHandler>> registrations;
  {
    std::lock_guard<std::mutex> l(_mutex);
    _socketConnected = YES;
    registrations = _connectedRegistrations;
    _connectedRegistrations.clear();
  }
  for (const auto &registration : registrations) {
    // Beware: don't capture the reference to handler in a dispatched block!
    ABI29_0_0RCTConnectedHandler handler = registration.handler;
    dispatch_async(registration.queue, ^{ handler(); });
  }
}

- (void)reconnectingWebSocket:(ABI29_0_0RCTReconnectingWebSocket *)webSocket didReceiveMessage:(id)message
{
  NSError *error = nil;
  NSDictionary<NSString *, id> *msg = ABI29_0_0RCTJSONParse(message, &error);

  if (error) {
    ABI29_0_0RCTLogError(@"%@ failed to parse message with error %@\n<message>\n%@\n</message>", [self class], error, msg);
    return;
  }

  if (!isSupportedVersion(msg[@"version"])) {
    ABI29_0_0RCTLogError(@"%@ received message with not supported version %@", [self class], msg[@"version"]);
    return;
  }

  NSString *const method = msg[@"method"];
  NSDictionary<NSString *, id> *const params = msg[@"params"];
  id messageId = msg[@"id"];

  if (messageId) { // Request
    const std::vector<Registration<ABI29_0_0RCTRequestHandler>> registrations(registrationsWithMethod(_mutex, _requestRegistrations, method));
    if (registrations.empty()) {
      ABI29_0_0RCTLogError(@"No handler found for packager method %@", msg[@"method"]);
      [[[ABI29_0_0RCTPackagerClientResponder alloc] initWithId:messageId
                                               socket:webSocket]
       respondWithError:
       [NSString stringWithFormat:@"No handler found for packager method %@", msg[@"method"]]];
    } else {
      // If there are multiple matching request registrations, only one can win;
      // otherwise the packager would get multiple responses. Choose the last one.
      ABI29_0_0RCTRequestHandler handler = registrations.back().handler;
      dispatch_async(registrations.back().queue, ^{
        handler(params, [[ABI29_0_0RCTPackagerClientResponder alloc] initWithId:messageId socket:webSocket]);
      });
    }
  } else { // Notification
    const std::vector<Registration<ABI29_0_0RCTNotificationHandler>> registrations(registrationsWithMethod(_mutex, _notificationRegistrations, method));
    for (const auto &registration : registrations) {
      // Beware: don't capture the reference to handler in a dispatched block!
      ABI29_0_0RCTNotificationHandler handler = registration.handler;
      dispatch_async(registration.queue, ^{ handler(params); });
    }
  }
}

- (void)reconnectingWebSocketDidClose:(ABI29_0_0RCTReconnectingWebSocket *)webSocket
{
  std::lock_guard<std::mutex> l(_mutex);
  _socketConnected = NO;
}

template <typename Handler>
static std::vector<Registration<Handler>> registrationsWithMethod(std::mutex &mutex, const std::vector<Registration<Handler>> &registrations, NSString *method)
{
  std::lock_guard<std::mutex> l(mutex); // Scope lock acquisition to prevent deadlock when calling out
  std::vector<Registration<Handler>> matches;
  for (const auto &reg : registrations) {
    if ([reg.method isEqual:method]) {
      matches.push_back(reg);
    }
  }
  return matches;
}

@end

#endif

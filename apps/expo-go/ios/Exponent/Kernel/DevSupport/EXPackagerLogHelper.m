// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXPackagerLogHelper.h"
#import <React/RCTLog.h>
#import <React/RCTReconnectingWebSocket.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTConstants.h>
#import <SocketRocket/SRWebSocket.h>

typedef NS_ENUM(NSInteger, EXLogLevel) {
  EXLogLevelInfo,
  EXLogLevelWarning,
  EXLogLevelError
};

@interface EXPackagerLogHelper () <SRWebSocketDelegate>

@property (nonatomic, assign) BOOL connected;
@property (nonatomic, strong) SRWebSocket *socket;
@property (nonatomic, strong) NSURL* bundleURL;
@property (nonatomic, strong) NSString* pendingMessage;
@property (nonatomic, assign) EXLogLevel logLevel;
@property (nonatomic, copy) void (^onComplete)(void);

@end

@implementation EXPackagerLogHelper

- (instancetype) initWithBundleURL:(NSURL*)url level:(EXLogLevel)level {
  if (self = [super init]) {
    _bundleURL = url;
    _logLevel = level;
  }
  return self;
}

- (void)dealloc
{
  if (_socket && _connected) {
    [_socket close];
    _connected = NO;
    _socket = nil;
  }
}

#pragma mark Public Interface

- (void) sendMessage:(NSString*) message withCompletion:(void (^)(void))onComplete
{
  _pendingMessage = message;
  _onComplete = onComplete;
  if (!_connected) {
    [self createSocket];
  } else {
    [self sendPendingMessage];
  }
}

#pragma mark Public Static members

+ (void) logInfo:(NSString*) message withBundleUrl:(NSURL*)url
{
  [EXPackagerLogHelper log:message withBundleUrl:url level:EXLogLevelInfo];
}

+ (void) logWarning:(NSString*) message withBundleUrl:(NSURL*)url
{
  [EXPackagerLogHelper log:message withBundleUrl:url level:EXLogLevelWarning];
}

+ (void) logError:(NSString*) message withBundleUrl:(NSURL*)url
{
  [EXPackagerLogHelper log:message withBundleUrl:url level:EXLogLevelError];
}

+ (void) log:(NSString*) message withBundleUrl:(NSURL*)url level:(EXLogLevel)level {
  __block EXPackagerLogHelper *strongHelper = [[EXPackagerLogHelper alloc] initWithBundleURL:url level:level];
  [strongHelper sendMessage:message withCompletion:^{
    strongHelper = nil;
  }];
}

#pragma mark SRWebSocketDelegate

- (void)webSocketDidOpen:(SRWebSocket *)webSocket {
  _connected = YES;
  [self sendPendingMessage];
}

- (void)webSocket:(SRWebSocket *)webSocket didFailWithError:(NSError *)error {
  // We're ignoring errors here.
}

- (void)webSocket:(SRWebSocket *)webSocket didCloseWithCode:(NSInteger)code reason:(nullable NSString *)reason wasClean:(BOOL)wasClean {
  _socket = nil;
  _connected = NO;
}

#pragma Internal methods

- (void) sendPendingMessage
{
  if (!_pendingMessage || !_connected || !_socket) {
    return;
  }
  
  NSString *type = _logLevel == EXLogLevelInfo ? @"info" :
    _logLevel == EXLogLevelWarning ? @"warn" : @"error";
  
  NSDictionary *payload = @{
    @"type": @"log",
    @"level": type,
    @"data": @[_pendingMessage],
  };
  
  _pendingMessage = nil;
  
  NSError *jsError = nil;
  NSString *json = RCTJSONStringify(payload, &jsError);
  if (!jsError) {
    NSError* socketError = nil;
    [_socket sendString: json error: &socketError];
    // We ignore errors - just swallow them since we're probl. already trying to display an
    // error and don't want to add more errors.
  }
  
  // Close socket
  [_socket close];
  _socket = nil;
  _connected = NO;
  
  // Call completion handler
  if (_onComplete) {
    _onComplete();
    _onComplete = nil;
  }
}

- (void) createSocket
{
  NSString *serverHost = _bundleURL.host;
  NSString *serverPort = [_bundleURL.port stringValue];
  NSString* scheme = [_bundleURL.scheme isEqualToString:@"exps"] || [_bundleURL.scheme isEqualToString:@"https"] ? @"https" : @"http";

  NSURLComponents *const components = [NSURLComponents new];
  components.host = serverHost ?: @"localhost";
  components.scheme = scheme;
  components.port = serverPort ? @(serverPort.integerValue) : @(kRCTBundleURLProviderDefaultPort);
  components.path = @"/hot";
  
  static dispatch_queue_t queue;
  static dispatch_once_t onceToken;

  dispatch_once(&onceToken, ^{
    queue = dispatch_queue_create("host.exp.Exponent.EXPackagerLogHelper", DISPATCH_QUEUE_SERIAL);
  });
  
  _socket = [[SRWebSocket alloc] initWithURL: components.URL];
  _socket.delegate = self;
  [_socket setDelegateDispatchQueue:queue];
  [_socket open];
}

@end

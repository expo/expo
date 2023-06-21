// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXVersionedNetworkInterceptor.h"

#import <React/RCTHTTPRequestHandler.h>
#import <React/RCTInspector.h>
#import <React/RCTInspectorPackagerConnection.h>
#import <SocketRocket/SRWebSocket.h>

#import "Expo_Go-Swift.h"
#import "ExpoModulesCore-Swift.h"

#pragma mark - RCTInspectorPackagerConnection category interface

@interface RCTInspectorPackagerConnection(sendWrappedEventToAllPages)

- (BOOL)isReadyToSend;
- (void)sendWrappedEventToAllPages:(NSString *)event;

@end

#pragma mark -

@interface EXVersionedNetworkInterceptor () <EXRequestCdpInterceptorDelegate>

@property (nonatomic, strong) RCTInspectorPackagerConnection *inspectorPackgerConnection;

@end

@implementation EXVersionedNetworkInterceptor

- (instancetype)initWithRCTInspectorPackagerConnection:(RCTInspectorPackagerConnection *)inspectorPackgerConnection
{
  if (self = [super init]) {
    self.inspectorPackgerConnection = inspectorPackgerConnection;
    [EXRequestCdpInterceptor.shared setDelegate:self];

    Class requestInterceptorClass = [EXRequestInterceptorProtocol class];
    RCTSetCustomNSURLSessionConfigurationProvider(^{
      NSURLSessionConfiguration *urlSessionConfiguration = [NSURLSessionConfiguration defaultSessionConfiguration];
      NSMutableArray<Class> *protocolClasses = [urlSessionConfiguration.protocolClasses mutableCopy];
      if (![protocolClasses containsObject:requestInterceptorClass]) {
        [protocolClasses insertObject:requestInterceptorClass atIndex:0];
      }
      urlSessionConfiguration.protocolClasses = protocolClasses;

      [urlSessionConfiguration setHTTPShouldSetCookies:YES];
      [urlSessionConfiguration setHTTPCookieAcceptPolicy:NSHTTPCookieAcceptPolicyAlways];
      [urlSessionConfiguration setHTTPCookieStorage:[NSHTTPCookieStorage sharedHTTPCookieStorage]];
      return urlSessionConfiguration;
    });
  }
  return self;
}

- (void)dealloc
{
  [EXRequestCdpInterceptor.shared setDelegate:nil];
}

#pragma mark - EXRequestCdpInterceptorDelegate implementations

- (void)dispatch:(NSString * _Nonnull)event {
  [self.inspectorPackgerConnection sendWrappedEventToAllPages:event];
}

@end

#pragma mark - RCTInspectorPackagerConnection category

@interface RCTInspectorPackagerConnection(sendWrappedEventToAllPages)

- (BOOL)isReadyToSend;
- (void)sendWrappedEventToAllPages:(NSString *)event;

@end

#pragma mark - RCTInspectorPackagerConnection category implementation

@implementation RCTInspectorPackagerConnection(sendWrappedEventToAllPages)

- (BOOL)isReadyToSend
{
  if ([self isConnected]) {
    return YES;
  }

  SRWebSocket *websocket = [self valueForKey:@"_webSocket"];
  return websocket.readyState == SR_OPEN;
}

- (void)sendWrappedEventToAllPages:(NSString *)event
{
  if (![self isReadyToSend]) {
    return;
  }

  SEL selector = NSSelectorFromString(@"sendWrappedEvent:message:");
  if ([self respondsToSelector:selector]) {
    IMP sendWrappedEventIMP = [self methodForSelector:selector];
    void (*functor)(id, SEL, NSString *, NSString *) = (void *)sendWrappedEventIMP;
    for (RCTInspectorPage* page in RCTInspector.pages) {
      if (![page.title containsString:@"Reanimated"]) {
        functor(self, selector, [@(page.id) stringValue], event);
      }
    }
  }
}

@end

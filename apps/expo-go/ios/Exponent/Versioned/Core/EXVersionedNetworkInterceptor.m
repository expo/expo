// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXVersionedNetworkInterceptor.h"

#import <React/RCTHTTPRequestHandler.h>
#import <React/RCTInspector.h>
#import <React/RCTCxxInspectorPackagerConnection.h>
#import <SocketRocket/SRWebSocket.h>

#import <ExpoModulesCore/ExpoModulesCore.h>
#import "ExpoModulesCore-Swift.h"
#import "Expo-Swift.h"

#pragma mark - RCTInspectorPackagerConnection category interface

@interface RCTCxxInspectorPackagerConnection(sendWrappedEventToAllPages)

- (BOOL)isReadyToSend;
- (void)sendWrappedEventToAllPages:(NSString *)event;

@end

#pragma mark -

@interface EXVersionedNetworkInterceptor () <EXRequestCdpInterceptorDelegate>

@property (nonatomic, strong) RCTCxxInspectorPackagerConnection *inspectorPackgerConnection;

@end

@implementation EXVersionedNetworkInterceptor

- (instancetype)initWithRCTInspectorPackagerConnection:(id)inspectorPackgerConnection
{
  if (self = [super init]) {
    self.inspectorPackgerConnection = inspectorPackgerConnection;
    [EXRequestCdpInterceptor.shared setDelegate:self];

    RCTSetCustomNSURLSessionConfigurationProvider(^{
      return [self createDefaultURLSessionConfiguration];
    });
    [EXFetchCustomExtension setCustomURLSessionConfigurationProvider:^{
      return [self createDefaultURLSessionConfiguration];
    }];
  }
  return self;
}

- (NSURLSessionConfiguration *)createDefaultURLSessionConfiguration
{
  Class requestInterceptorClass = [EXRequestInterceptorProtocol class];
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

@interface RCTCxxInspectorPackagerConnection(sendWrappedEventToAllPages)

- (BOOL)isReadyToSend;
- (void)sendWrappedEventToAllPages:(NSString *)event;

@end

#pragma mark - RCTInspectorPackagerConnection category implementation

@implementation RCTCxxInspectorPackagerConnection(sendWrappedEventToAllPages)

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

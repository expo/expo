// Copyright 2019-present 650 Industries. All rights reserved.

#import "EXSimpleTokenDispatcher.h"
#import <EXNotifications/EXOnTokenChangeListener.h>
#import <EXNotifications/EXEngine.h>
#import <EXNotifications/NSData+EXRemoteNotifications.h>

@interface EXSimpleTokenDispatcher ()

@property (strong) NSUserDefaults *defaults;

@property (strong) NSMutableDictionary<NSString*,id<EXOnTokenChangeListener>> *listeners;

@property (strong) id<EXEngine> engine;

@end

@implementation EXSimpleTokenDispatcher

- (instancetype)initWithEngine:(id<EXEngine>)engine
{
  if (self = [super init])
  {
    NSString *className = NSStringFromClass([self class]);
    _defaults = [[NSUserDefaults alloc] initWithSuiteName:className];
    _listeners = [NSMutableDictionary new];
    _engine = engine;
  }
  return self;
}

- (void)onNewToken:(NSData *)token
{
  NSString *tokenStringFormat = [token apnsTokenString];
  
  NSString *lastToken = [_defaults stringForKey:@"token"];
  if (lastToken == nil || ![lastToken isEqualToString:tokenStringFormat])
  {
    [_defaults setObject:tokenStringFormat forKey:@"token"];
    [_engine sendTokenToServer:tokenStringFormat];
    
    for (NSString *key in [_listeners allKeys]) {
      id<EXOnTokenChangeListener> listener = _listeners[key];
      [listener onTokenChange:[_engine generateTokenForAppId:key withToken:tokenStringFormat]];
    }
  }
}

- (void)registerForPushTokenWithAppId:(NSString*)appId onTokenChangeListener:(id<EXOnTokenChangeListener>)onTokenChangeListener
{
  [self maybeRegisterForNotifications];
  
  NSString *token = [_defaults stringForKey:@"token"];
  NSString *lastAppIdToken = [_defaults stringForKey:appId];
  if (token != nil && [token isEqualToString:lastAppIdToken]) {
    [_defaults setObject:token forKey:appId];
    [onTokenChangeListener onTokenChange:[_engine generateTokenForAppId:appId withToken:token]];
  }
  
  [_listeners setObject:onTokenChangeListener forKey:appId];
}

- (void)unregisterWithAppId:(NSString*)appId
{
  [_listeners removeObjectForKey:appId];
}

- (void)maybeRegisterForNotifications
{
  if ([_listeners count] == 0) {
    dispatch_async(dispatch_get_main_queue(), ^{
      BOOL registered = [[UIApplication sharedApplication] isRegisteredForRemoteNotifications];
      if (!registered) {
        [[UIApplication sharedApplication] registerForRemoteNotifications];
      }
    });
  }
}

@end

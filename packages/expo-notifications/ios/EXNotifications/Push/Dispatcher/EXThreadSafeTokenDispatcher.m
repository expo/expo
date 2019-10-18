// Copyright 2019-present 650 Industries. All rights reserved.

#import <EXNotifications/EXThreadSafeTokenDispatcher.h>
#import <EXNotifications/EXSimpleTokenDispatcher.h>

#import <EXNotifications/EXEngine.h>
#import <EXNotifications/EXPushEngineProvider.h>
#import <EXNotifications/EXSimplePushEngineProvider.h>

@interface EXThreadSafeTokenDispatcher ()

@property id<EXTokenDispatcher> insecureTokenDispatcher;

@end

@implementation EXThreadSafeTokenDispatcher

static dispatch_queue_t queue;

- (instancetype)init
{
  if (self = [super init]) {
    id<EXEngine> engine = [EXSimplePushEngineProvider getEngine];
    _insecureTokenDispatcher = [[EXSimpleTokenDispatcher alloc] initWithEngine:engine];
  }
  return self;
}

+ (id<EXTokenDispatcher>)sharedInstance
{
  static EXThreadSafeTokenDispatcher *sharedInstance = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedInstance = [[EXThreadSafeTokenDispatcher alloc] init];
    queue = dispatch_queue_create("host.exp.exponent.EXThreadSafeTokenDispatcher", DISPATCH_QUEUE_SERIAL);
  });
  return sharedInstance;
}

- (void)onNewToken:(NSData *)token {
  __weak id<EXTokenDispatcher> tokenDipatcher = _insecureTokenDispatcher;
  dispatch_async(queue, ^{
    [tokenDipatcher onNewToken:token];
  });
}

- (void)registerForPushTokenWithAppId:(NSString *)appId onTokenChangeListener:(id<EXOnTokenChangeListener>)onTokenChangeListener {
  __weak id<EXTokenDispatcher> tokenDipatcher = _insecureTokenDispatcher;
  dispatch_async(queue, ^{
    [tokenDipatcher registerForPushTokenWithAppId:appId onTokenChangeListener:onTokenChangeListener];
  });
}

- (void)unregisterWithAppId:(NSString *)appId {
  __weak id<EXTokenDispatcher> tokenDipatcher = _insecureTokenDispatcher;
  dispatch_async(queue, ^{
    [tokenDipatcher unregisterWithAppId:appId];
  });
}

@end

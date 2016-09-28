// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXKernelModule.h"
#import "EXAppDelegate.h"
#import "EXKernel.h"
#import "EXVersions.h"
#import "EXManifestResource.h"
#import "RCTEventDispatcher.h"

NSString * const kEXKernelJSIsLoadedNotification = @"EXKernelModuleIsLoadedNotification";

@interface EXKernelModule ()

@property (nonatomic, assign) BOOL hasListeners;
@property (nonatomic, strong) NSMutableDictionary *eventSuccessBlocks;
@property (nonatomic, strong) NSMutableDictionary *eventFailureBlocks;

@end

@implementation EXKernelModule

+ (NSString *)moduleName { return @"ExponentKernel"; }

- (instancetype)init
{
  if (self = [super init]) {
    _eventSuccessBlocks = [NSMutableDictionary dictionary];
    _eventFailureBlocks = [NSMutableDictionary dictionary];
  }
  return self;
}

- (NSDictionary *)constantsToExport
{
  return @{ @"sdkVersions": [EXVersions sharedInstance].versions[@"sdkVersions"] };
}

#pragma mark - RCTEventEmitter methods

- (NSArray<NSString *> *)supportedEvents
{
  return @[];
}

/**
 *  Override this method to avoid the [self supportedEvents] validation
 */
- (void)sendEventWithName:(NSString *)eventName body:(id)body
{
  [self.bridge enqueueJSCall:@"RCTDeviceEventEmitter.emit"
                        args:body ? @[eventName, body] : @[eventName]];
}

#pragma mark -

- (void)dispatchJSEvent:(NSString *)eventName body:(NSDictionary *)eventBody onSuccess:(void (^)(NSDictionary *))success onFailure:(void (^)(NSString *))failure
{
  NSString *qualifiedEventName = [NSString stringWithFormat:@"ExponentKernel.%@", eventName];
  NSMutableDictionary *qualifiedEventBody = (eventBody) ? [eventBody mutableCopy] : [NSMutableDictionary dictionary];

  if (success && failure) {
    NSString *eventId = [[NSUUID UUID] UUIDString];
    [_eventSuccessBlocks setObject:success forKey:eventId];
    [_eventFailureBlocks setObject:failure forKey:eventId];
    [qualifiedEventBody setObject:eventId forKey:@"eventId"];
  }

  [self sendEventWithName:qualifiedEventName body:qualifiedEventBody];
}

/**
 *  Duplicates Linking.openURL but does not validate that this is an exponent URL;
 *  in other words, we just take your word for it and never hand it off to iOS.
 *  Used by the home screen URL bar.
 */
RCT_EXPORT_METHOD(openURL:(NSURL *)URL
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(__unused RCTPromiseRejectBlock)reject)
{
  if (URL) {
    [[NSNotificationCenter defaultCenter] postNotificationName:EX_UNVERSIONED(@"EXKernelOpenUrlNotification")
                                                        object:nil
                                                      userInfo:@{
                                                                 @"bridge": self.bridge,
                                                                 @"url": URL.absoluteString,
                                                                 }];
    resolve(@YES);
  } else {
    NSError *err = [NSError errorWithDomain:kEXKernelErrorDomain code:-1 userInfo:@{ NSLocalizedDescriptionKey: @"Cannot open a nil url" }];
    reject(@"E_INVALID_URL", err.localizedDescription, err);
  }
}

RCT_EXPORT_METHOD(addDevMenu)
{
  __weak typeof(self) weakSelf = self;
  dispatch_async(dispatch_get_main_queue(), ^{
    if (weakSelf.delegate) {
      [weakSelf.delegate kernelModuleDidSelectDevMenu:weakSelf];
    }
  });
}

RCT_REMAP_METHOD(routeDidForeground,
                 routeDidForegroundWithType:(NSUInteger)routeType
                 params:(NSDictionary *)params)
{
  __weak typeof(self) weakSelf = self;
  dispatch_async(dispatch_get_main_queue(), ^{
    if (weakSelf.delegate) {
      [weakSelf.delegate kernelModule:weakSelf taskDidForegroundWithType:routeType params:params];
    }
  });
}

RCT_EXPORT_METHOD(onLoaded)
{
  [[NSNotificationCenter defaultCenter] postNotificationName:kEXKernelJSIsLoadedNotification object:self];
}

RCT_REMAP_METHOD(getManifestAsync,
                 getManifestWithUrl:(NSURL *)url
                 originalUrl:(NSURL *)originalUrl
                 resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
  EXManifestResource *manifestResource = [[EXManifestResource alloc] initWithManifestUrl:url originalUrl:originalUrl];
  [manifestResource loadResourceWithBehavior:kEXCachedResourceFallBackToCache successBlock:^(NSData * _Nonnull data) {
    NSString *manifestString = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
    resolve(manifestString);
  } errorBlock:^(NSError * _Nonnull error) {
    reject([NSString stringWithFormat:@"%d", error.code], error.localizedDescription, error);
  }];
}

RCT_REMAP_METHOD(onEventSuccess,
                 eventId:(NSString *)eventId
                 body:(NSDictionary *)body)
{
  void (^success)(NSDictionary *) = [_eventSuccessBlocks objectForKey:eventId];
  if (success) {
    success(body);
    [_eventSuccessBlocks removeObjectForKey:eventId];
    [_eventFailureBlocks removeObjectForKey:eventId];
  }
}

RCT_REMAP_METHOD(onEventFailure,
                 eventId:(NSString *)eventId
                 message:(NSString *)message)
{
  void (^failure)(NSString *) = [_eventFailureBlocks objectForKey:eventId];
  if (failure) {
    failure(message);
    [_eventSuccessBlocks removeObjectForKey:eventId];
    [_eventFailureBlocks removeObjectForKey:eventId];
  }
}

@end

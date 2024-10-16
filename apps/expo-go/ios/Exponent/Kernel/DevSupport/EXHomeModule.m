// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXHomeModule.h"
#import "EXSession.h"
#import "EXUnversioned.h"
#import "EXClientReleaseType.h"
#import "EXKernelDevKeyCommands.h"

#import "EXDevMenuManager.h"

#import <React/RCTEventDispatcher.h>

NSString *const kEXLastFatalErrorDateDefaultsKey = @"EXKernelLastFatalErrorDateDefaultsKey";

@interface EXHomeModule ()

@property (nonatomic, assign) BOOL hasListeners;
@property (nonatomic, strong) NSMutableDictionary *eventSuccessBlocks;
@property (nonatomic, strong) NSMutableDictionary *eventFailureBlocks;
@property (nonatomic, strong) NSArray * _Nonnull sdkVersions;
@property (nonatomic, weak) id<EXHomeModuleDelegate> delegate;

@end

@implementation EXHomeModule

+ (NSString *)moduleName { return @"ExponentKernel"; }

- (instancetype)initWithExperienceStableLegacyId:(NSString *)experienceStableLegacyId
                                        scopeKey:(NSString *)scopeKey
                                    easProjectId:(NSString *)easProjectId
                           kernelServiceDelegate:(id)kernelServiceInstance
                                          params:(NSDictionary *)params {
  if (self = [super initWithExperienceStableLegacyId:experienceStableLegacyId
                                            scopeKey:scopeKey
                                        easProjectId:easProjectId
                              kernelServiceDelegates:kernelServiceInstance
                                              params:params]) {
    _eventSuccessBlocks = [NSMutableDictionary dictionary];
    _eventFailureBlocks = [NSMutableDictionary dictionary];
    _sdkVersions = params[@"constants"][@"supportedExpoSdks"];
    _delegate = kernelServiceInstance;

    // Register keyboard commands like Cmd+D for the simulator.
    [[EXKernelDevKeyCommands sharedInstance] registerDevCommands];
  }
  return self;
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (NSDictionary *)constantsToExport
{
  return @{ @"sdkVersions": _sdkVersions,
            @"IOSClientReleaseType": [EXClientReleaseType clientReleaseType] };
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
  // Note that this could be a versioned bridge!
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
 * Requests JavaScript side to start closing the dev menu (start the animation or so).
 * Fully closes the dev menu once it receives a response from that event.
 */
- (void)requestToCloseDevMenu
{
  void (^callback)(id) = ^(id arg){
    [[EXDevMenuManager sharedInstance] closeWithoutAnimation];
  };
  [self dispatchJSEvent:@"requestToCloseDevMenu" body:nil onSuccess:callback onFailure:callback];
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
    [_delegate homeModule:self didOpenUrl:URL.absoluteString];
    resolve(@YES);
  } else {
    NSError *err = [NSError errorWithDomain:EX_UNVERSIONED(@"EXKernelErrorDomain") code:-1 userInfo:@{ NSLocalizedDescriptionKey: @"Cannot open a nil url" }];
    reject(@"E_INVALID_URL", err.localizedDescription, err);
  }
}

/**
 * Returns boolean value determining whether the current app supports developer tools.
 */
RCT_REMAP_METHOD(doesCurrentTaskEnableDevtoolsAsync,
                 doesCurrentTaskEnableDevtoolsWithResolver:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
  if (_delegate) {
    resolve(@([_delegate homeModuleShouldEnableDevtools:self]));
  } else {
    // don't reject, just disable devtools
    resolve(@NO);
  }
}

/**
 * Gets a dictionary of dev menu options available in the currently shown experience,
 * If the experience doesn't support developer tools just returns an empty response.
 */
RCT_REMAP_METHOD(getDevMenuItemsToShowAsync,
                 getDevMenuItemsToShowWithResolver:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
  if (_delegate && [_delegate homeModuleShouldEnableDevtools:self]) {
    resolve([_delegate devMenuItemsForHomeModule:self]);
  } else {
    // don't reject, just show no devtools
    resolve(@{});
  }
}

/**
 * Function called every time the dev menu option is selected.
 */
RCT_EXPORT_METHOD(selectDevMenuItemWithKeyAsync:(NSString *)key)
{
  if (_delegate) {
    [_delegate homeModule:self didSelectDevMenuItemWithKey:key];
  }
}

/**
 * Reloads currently shown app with the manifest.
 */
RCT_EXPORT_METHOD(reloadAppAsync)
{
  if (_delegate) {
    [_delegate homeModuleDidSelectRefresh:self];
  }
}

/**
 * Immediately closes the dev menu if it's visible.
 * Note: It skips the animation that would have been applied by the JS side.
 */
RCT_EXPORT_METHOD(closeDevMenuAsync)
{
  [[EXDevMenuManager sharedInstance] closeWithoutAnimation];
}

/**
 * Goes back to the home app.
 */
RCT_EXPORT_METHOD(goToHomeAsync)
{
  if (_delegate) {
    [_delegate homeModuleDidSelectGoToHome:self];
  }
}

/**
 * Opens QR scanner to open another app by scanning its QR code.
 */
RCT_EXPORT_METHOD(selectQRReader)
{
  if (_delegate) {
    [_delegate homeModuleDidSelectQRReader:self];
  }
}

RCT_REMAP_METHOD(getDevMenuSettingsAsync,
                 getDevMenuSettingsAsync:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  EXDevMenuManager *manager = [EXDevMenuManager sharedInstance];

  resolve(@{
    @"motionGestureEnabled": @(manager.interceptMotionGesture),
    @"touchGestureEnabled": @(manager.interceptTouchGesture),
  });
}

RCT_REMAP_METHOD(setDevMenuSettingAsync,
                 setDevMenuSetting:(NSString *)key
                 withValue:(id)value
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  EXDevMenuManager *manager = [EXDevMenuManager sharedInstance];

  if ([key isEqualToString:@"motionGestureEnabled"]) {
    manager.interceptMotionGesture = [value boolValue];
    return resolve(nil);
  } else if ([key isEqualToString:@"touchGestureEnabled"]) {
    manager.interceptTouchGesture = [value boolValue];
    return resolve(nil);
  } else {
    return reject(@"ERR_DEV_MENU_SETTING_NOT_EXISTS", @"Specified dev menu setting doesn't exist.", nil);
  }
}

RCT_REMAP_METHOD(getSessionAsync,
                 getSessionAsync:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  NSDictionary *session = [[EXSession sharedInstance] session];
  resolve(session);
}

RCT_REMAP_METHOD(setSessionAsync,
                 setSessionAsync:(NSDictionary *)session
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  NSError *error;
  BOOL success = [[EXSession sharedInstance] saveSessionToKeychain:session error:&error];
  if (success) {
    resolve(nil);
  } else {
    reject(@"ERR_SESSION_NOT_SAVED", @"Could not save session", error);
  }
}

RCT_REMAP_METHOD(removeSessionAsync,
                 removeSessionAsync:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  NSError *error;
  BOOL success = [[EXSession sharedInstance] deleteSessionFromKeychainWithError:&error];
  if (success) {
    resolve(nil);
  } else {
    reject(@"ERR_SESSION_NOT_REMOVED", @"Could not remove session", error);
  }
}

/**
 * Checks whether the dev menu onboarding is already finished.
 * Onboarding is a screen that shows the dev menu to the user that opens any experience for the first time.
*/
RCT_REMAP_METHOD(getIsOnboardingFinishedAsync,
                 getIsOnboardingFinishedWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  if (_delegate) {
    BOOL isFinished = [_delegate homeModuleShouldFinishNux:self];
    resolve(@(isFinished));
  } else {
    resolve(@(NO));
  }
}

/**
 * Sets appropriate setting in user defaults that user's onboarding has finished.
 */
RCT_REMAP_METHOD(setIsOnboardingFinishedAsync,
                 setIsOnboardingFinished:(BOOL)isOnboardingFinished)
{
  if (_delegate) {
    [_delegate homeModule:self didFinishNux:isOnboardingFinished];
  }
}

/**
 * Called when the native event has succeeded on the JS side.
 */
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

/**
 * Called when the native event has failed on the JS side.
 */
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

RCT_EXPORT_METHOD(getLastCrashDate:(RCTPromiseResolveBlock)resolve
                   rejecter:(RCTPromiseRejectBlock)reject)
{
  NSDate *retrievedTimestamp = [[NSUserDefaults standardUserDefaults] objectForKey:kEXLastFatalErrorDateDefaultsKey];
  if(!retrievedTimestamp) {
    resolve(nil);
    return;
  }

  resolve(@([retrievedTimestamp timeIntervalSince1970] * 1000));
}

@end

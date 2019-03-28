// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXEnvironment.h"
#import "EXHomeModule.h"
#import "EXSession.h"
#import "EXUnversioned.h"

#import <React/RCTEventDispatcher.h>

@interface EXHomeModule ()

@property (nonatomic, assign) BOOL hasListeners;
@property (nonatomic, strong) NSMutableDictionary *eventSuccessBlocks;
@property (nonatomic, strong) NSMutableDictionary *eventFailureBlocks;
@property (nonatomic, strong) NSArray * _Nonnull sdkVersions;
@property (nonatomic, weak) id<EXHomeModuleDelegate> delegate;

@end

@implementation EXHomeModule

+ (NSString *)moduleName { return @"ExponentKernel"; }

/** embedded.mobileprovision plist format:
 
 AppIDName, // string — TextDetective
 ApplicationIdentifierPrefix[],  // [ string - 66PK3K3KEV ]
 CreationData, // date — 2013-01-17T14:18:05Z
 DeveloperCertificates[], // [ data ]
 Entitlements {
 application-identifier // string - 66PK3K3KEV.com.blindsight.textdetective
 get-task-allow // true or false
 keychain-access-groups[] // [ string - 66PK3K3KEV.* ]
 },
 ExpirationDate, // date — 2014-01-17T14:18:05Z
 Name, // string — Barrierefreikommunizieren (name assigned to the provisioning profile used)
 ProvisionedDevices[], // [ string.... ]
 TeamIdentifier[], // [string — HHBT96X2EX ]
 TeamName, // string — The Blindsight Corporation
 TimeToLive, // integer - 365
 UUID, // string — 79F37E8E-CC8D-4819-8C13-A678479211CE
 Version, // integer — 1
 ProvisionsAllDevices // true or false  ***NB: not sure if this is where this is
 
 */

-(NSDictionary*) getMobileProvision {
  static NSDictionary* mobileProvision = nil;
  if (!mobileProvision) {
    NSString *provisioningPath = [[NSBundle mainBundle] pathForResource:@"embedded" ofType:@"mobileprovision"];
    if (!provisioningPath) {
      mobileProvision = @{};
      return mobileProvision;
    }
    // NSISOLatin1 keeps the binary wrapper from being parsed as unicode and dropped as invalid
    NSString *binaryString = [NSString stringWithContentsOfFile:provisioningPath encoding:NSISOLatin1StringEncoding error:NULL];
    if (!binaryString) {
      return nil;
    }
    NSScanner *scanner = [NSScanner scannerWithString:binaryString];
    BOOL ok = [scanner scanUpToString:@"<plist" intoString:nil];
    if (!ok) { NSLog(@"unable to find beginning of plist"); return nil; }
    NSString *plistString;
    ok = [scanner scanUpToString:@"</plist>" intoString:&plistString];
    if (!ok) { NSLog(@"unable to find end of plist"); return nil; }
    plistString = [NSString stringWithFormat:@"%@</plist>",plistString];
    // juggle latin1 back to utf-8!
    NSData *plistdata_latin1 = [plistString dataUsingEncoding:NSISOLatin1StringEncoding];
    //    plistString = [NSString stringWithUTF8String:[plistdata_latin1 bytes]];
    //    NSData *plistdata2_latin1 = [plistString dataUsingEncoding:NSISOLatin1StringEncoding];
    NSError *error = nil;
    mobileProvision = [NSPropertyListSerialization propertyListWithData:plistdata_latin1 options:NSPropertyListImmutable format:NULL error:&error];
    if (error) {
      NSLog(@"error parsing extracted plist — %@",error);
      if (mobileProvision) {
        mobileProvision = nil;
      }
      return nil;
    }
  }
  return mobileProvision;
}

-(EXClientReleaseType) getClientReleaseType {
  NSDictionary *mobileProvision = [self getMobileProvision];
  if (!mobileProvision) {
    // failure to read other than it simply not existing
    return EXClientReleaseTypeUnknown;
  } else if (![mobileProvision count]) {
#if TARGET_IPHONE_SIMULATOR
    return EXClientReleaseSimulator;
#else
    return EXClientReleaseAppStore;
#endif
  } else if ([[mobileProvision objectForKey:@"ProvisionsAllDevices"] boolValue]) {
    // enterprise distribution contains ProvisionsAllDevices - true
    return EXClientReleaseEnterprise;
  } else if ([mobileProvision objectForKey:@"ProvisionedDevices"] && [[mobileProvision objectForKey:@"ProvisionedDevices"] count] > 0) {
    // development contains UDIDs and get-task-allow is true
    // ad hoc contains UDIDs and get-task-allow is false
    NSDictionary *entitlements = [mobileProvision objectForKey:@"Entitlements"];
    if ([[entitlements objectForKey:@"get-task-allow"] boolValue]) {
      return EXClientReleaseDev;
    } else {
      return EXClientReleaseAdHoc;
    }
  } else {
    // app store contains no UDIDs (if the file exists at all?)
    return EXClientReleaseAppStore;
  }
}

- (NSString *)clientReleaseTypeToJS: (EXClientReleaseType) releaseType
{
  switch (releaseType)
  {
    case EXClientReleaseTypeUnknown:
      return @"UNKNOWN";
    case EXClientReleaseSimulator:
      return @"SIMULATOR";
    case EXClientReleaseEnterprise:
      return @"ENTERPRISE";
    case EXClientReleaseDev:
      return @"DEVELOPMENT";
    case EXClientReleaseAdHoc:
      return @"ADHOC";
    case EXClientReleaseAppStore:
      return @"APPLE_APP_STORE";
  }
}

- (EXClientReleaseType) getClientReleaseTypeAsync
{
  NSDictionary *mobileProvision = [self getMobileProvision];
  if (!mobileProvision) {
    // failure to read other than it simply not existing
    return EXClientReleaseTypeUnknown;
  } else if (![mobileProvision count]) {
#if TARGET_IPHONE_SIMULATOR
    return EXClientReleaseSimulator;
#else
    return EXClientReleaseAppStore;
#endif
  } else if ([[mobileProvision objectForKey:@"ProvisionsAllDevices"] boolValue]) {
    // enterprise distribution contains ProvisionsAllDevices - true
    return EXClientReleaseEnterprise;
  } else if ([mobileProvision objectForKey:@"ProvisionedDevices"] && [[mobileProvision objectForKey:@"ProvisionedDevices"] count] > 0) {
    // development contains UDIDs and get-task-allow is true
    // ad hoc contains UDIDs and get-task-allow is false
    NSDictionary *entitlements = [mobileProvision objectForKey:@"Entitlements"];
    if ([[entitlements objectForKey:@"get-task-allow"] boolValue]) {
      return EXClientReleaseDev;
    } else {
      return EXClientReleaseAdHoc;
    }
  } else {
    // app store contains no UDIDs (if the file exists at all?)
    return EXClientReleaseAppStore;
  }
}

- (instancetype)initWithExperienceId:(NSString *)experienceId kernelServiceDelegate:(id)kernelServiceInstance params:(NSDictionary *)params
{
  if (self = [super initWithExperienceId:experienceId kernelServiceDelegate:kernelServiceInstance params:params]) {
    _eventSuccessBlocks = [NSMutableDictionary dictionary];
    _eventFailureBlocks = [NSMutableDictionary dictionary];
    _sdkVersions = params[@"supportedSdkVersions"];
    _delegate = kernelServiceInstance;
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
            @"IOSClientReleaseType": [self clientReleaseTypeToJS: [self getClientReleaseTypeAsync]] };
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

RCT_REMAP_METHOD(doesCurrentTaskEnableDevtools,
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

RCT_REMAP_METHOD(isLegacyMenuBehaviorEnabledAsync,
                 isLegacyMenuBehaviorEnabledWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  if (_delegate) {
    resolve(@([_delegate homeModuleShouldEnableLegacyMenuBehavior:self]));
  } else {
    resolve(@(NO));
  }
}

RCT_EXPORT_METHOD(setIsLegacyMenuBehaviorEnabledAsync:(BOOL)isEnabled)
{
  if (_delegate) {
    [_delegate homeModule:self didSelectEnableLegacyMenuBehavior:isEnabled];
  }
}

RCT_REMAP_METHOD(getDevMenuItemsToShow,
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

RCT_EXPORT_METHOD(selectDevMenuItemWithKey:(NSString *)key)
{
  if (_delegate) {
    [_delegate homeModule:self didSelectDevMenuItemWithKey:key];
  }
}

RCT_EXPORT_METHOD(selectRefresh)
{
  if (_delegate) {
    [_delegate homeModuleDidSelectRefresh:self];
  }
}

RCT_EXPORT_METHOD(selectCloseMenu)
{
  if (_delegate) {
    [_delegate homeModuleDidSelectCloseMenu:self];
  }
}

RCT_EXPORT_METHOD(selectGoToHome)
{
  if (_delegate) {
    [_delegate homeModuleDidSelectGoToHome:self];
  }
}

RCT_EXPORT_METHOD(selectQRReader)
{
  if (_delegate) {
    [_delegate homeModuleDidSelectQRReader:self];
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

RCT_EXPORT_METHOD(addDevMenu)
{
  __weak typeof(self) weakSelf = self;
  dispatch_async(dispatch_get_main_queue(), ^{
    if (weakSelf.delegate) {
      [weakSelf.delegate homeModuleDidSelectHomeDiagnostics:self];
    }
  });
}

RCT_REMAP_METHOD(getIsNuxFinishedAsync,
                 getIsNuxFinishedWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  if (_delegate) {
    BOOL isFinished = [_delegate homeModuleShouldFinishNux:self];
    resolve(@(isFinished));
  } else {
    resolve(@(NO));
  }
}

RCT_REMAP_METHOD(setIsNuxFinishedAsync,
                 setIsNuxFinished:(BOOL)isNuxFinished)
{
  if (_delegate) {
    [_delegate homeModule:self didFinishNux:isNuxFinished];
  }
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

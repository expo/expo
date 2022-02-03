#import <ABI44_0_0EXAdsFacebook/ABI44_0_0EXAdSettingsManager.h>
#import <ABI44_0_0EXAdsFacebook/ABI44_0_0EXFacebookAdsAppTrackingPermissionRequester.h>

#import <FBAudienceNetwork/FBAudienceNetwork.h>

#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXAppLifecycleService.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXPermissionsInterface.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXPermissionsMethodsDelegate.h>

@interface ABI44_0_0EXAdSettingsManager ()

@property (nonatomic) BOOL isChildDirected;
@property (nonatomic, strong) NSString *mediationService;
@property (nonatomic, strong, nullable) NSString *urlPrefix;
@property (nonatomic, weak) ABI44_0_0EXModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<ABI44_0_0EXPermissionsInterface> permissionsManager;
@property (nonatomic) FBAdLogLevel logLevel;
@property (nonatomic, strong) NSMutableArray<NSString*> *testDevices;

@end

@implementation ABI44_0_0EXAdSettingsManager

ABI44_0_0EX_EXPORT_MODULE(CTKAdSettingsManager)

- (instancetype)init {
  if (self = [super init]) {
    _testDevices = [NSMutableArray new];
    _mediationService = @"";
  }
  return self;
}

- (void)setModuleRegistry:(ABI44_0_0EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  [[_moduleRegistry getModuleImplementingProtocol:@protocol(ABI44_0_0EXAppLifecycleService)] registerAppLifecycleListener:self];
  
  _permissionsManager = [_moduleRegistry getModuleImplementingProtocol:@protocol(ABI44_0_0EXPermissionsInterface)];
  [ABI44_0_0EXPermissionsMethodsDelegate registerRequesters:@[[ABI44_0_0EXFacebookAdsAppTrackingPermissionRequester new]] withPermissionsManager:_permissionsManager];
}

ABI44_0_0EX_EXPORT_METHOD_AS(getPermissionsAsync,
                    getPermissionsAsync:(ABI44_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI44_0_0EXPromiseRejectBlock)reject)
{
  [ABI44_0_0EXPermissionsMethodsDelegate getPermissionWithPermissionsManager:_permissionsManager
                                                      withRequester:[ABI44_0_0EXFacebookAdsAppTrackingPermissionRequester class]
                                                            resolve:resolve
                                                             reject:reject];
}

ABI44_0_0EX_EXPORT_METHOD_AS(requestPermissionsAsync,
                    requestPermissionsAsync:(ABI44_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI44_0_0EXPromiseRejectBlock)reject)
{
  [ABI44_0_0EXPermissionsMethodsDelegate askForPermissionWithPermissionsManager:_permissionsManager
                                                         withRequester:[ABI44_0_0EXFacebookAdsAppTrackingPermissionRequester class]
                                                               resolve:resolve
                                                                reject:reject];
}

ABI44_0_0EX_EXPORT_METHOD_AS(setAdvertiserTrackingEnabled,
                    setAdvertiserTrackingEnabled:(BOOL)enabled
                    resolve:(ABI44_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI44_0_0EXPromiseRejectBlock)reject)
{
  [FBAdSettings setAdvertiserTrackingEnabled:enabled];
  resolve(nil);
}

ABI44_0_0EX_EXPORT_METHOD_AS(addTestDevice,
                    addTestDevice:(NSString *)deviceHash
                    resolve:(ABI44_0_0EXPromiseResolveBlock)resolver
                    reject:(ABI44_0_0EXPromiseRejectBlock)rejecter)
{
  [FBAdSettings addTestDevice:deviceHash];
  [_testDevices addObject:deviceHash];
  resolver(nil);
}

ABI44_0_0EX_EXPORT_METHOD_AS(clearTestDevices,
                    clearTestDevicesWithResolver:(ABI44_0_0EXPromiseResolveBlock)resolver
                    reject:(ABI44_0_0EXPromiseRejectBlock)rejecter)
{
  [FBAdSettings clearTestDevices];
  [_testDevices removeAllObjects];
}

ABI44_0_0EX_EXPORT_METHOD_AS(setLogLevel,
                    setLogLevel:(NSString *)logLevelKey
                    resolve:(ABI44_0_0EXPromiseResolveBlock)resolver
                    reject:(ABI44_0_0EXPromiseRejectBlock)rejecter)
{
  FBAdLogLevel logLevel = [@{
                           @"none": @(FBAdLogLevelNone),
                           @"debug": @(FBAdLogLevelDebug),
                           @"verbose": @(FBAdLogLevelVerbose),
                           @"warning": @(FBAdLogLevelWarning),
                           @"notification": @(FBAdLogLevelNotification),
                           @"error": @(FBAdLogLevelError)
                           }[logLevelKey] integerValue] ?: FBAdLogLevelLog;
  [FBAdSettings setLogLevel:logLevel];
  _logLevel = logLevel;
  resolver(nil);
}

ABI44_0_0EX_EXPORT_METHOD_AS(setIsChildDirected,
                    setIsChildDirected:(BOOL)isDirected
                    resolve:(ABI44_0_0EXPromiseResolveBlock)resolver
                    reject:(ABI44_0_0EXPromiseRejectBlock)rejecter)
{
  [FBAdSettings setIsChildDirected:isDirected];
  _isChildDirected = isDirected;
  resolver(nil);
}

ABI44_0_0EX_EXPORT_METHOD_AS(setMeditationService,
                    setMediationService:(NSString *)mediationService
                    resolve:(ABI44_0_0EXPromiseResolveBlock)resolver
                    reject:(ABI44_0_0EXPromiseRejectBlock)rejecter)
{
  [FBAdSettings setMediationService:mediationService];
  _mediationService = mediationService;
  resolver(nil);
}

ABI44_0_0EX_EXPORT_METHOD_AS(setUrlPrefix,
                    setUrlPrefix:(NSString *)urlPrefix
                    resolve:(ABI44_0_0EXPromiseResolveBlock)resolver
                    reject:(ABI44_0_0EXPromiseRejectBlock)rejecter)
{
  [FBAdSettings setUrlPrefix:urlPrefix];
  resolver(nil);
}

-(void)onAppForegrounded
{
  [FBAdSettings setIsChildDirected:_isChildDirected];
  [FBAdSettings setMediationService:_mediationService];
  // Calling setUrlPrefix always triggers a network request to Facebook,
  // so we don't want to call it without need.
  //
  // If _urlPrefix is empty we have nothing to do (foregrounding app
  // doesn't customize urlPrefix). If it's not empty we need to call
  // setUrlPrefix to ensure FBAdSettings is configured properly.
  if ([_urlPrefix length] > 0) {
    [FBAdSettings setUrlPrefix:_urlPrefix];
  }
  [FBAdSettings setLogLevel:_logLevel];
  [FBAdSettings addTestDevices:_testDevices];
}

- (void)onAppBackgrounded
{
  [FBAdSettings setIsChildDirected:NO];
  [FBAdSettings setMediationService:@""];
  _urlPrefix = FBAdSettings.urlPrefix;
  // Calling setUrlPrefix always triggers a network request to Facebook,
  // so we don't want to call it without need.
  //
  // If FBAdSettings.urlPrefix is empty we have nothing to do (backgrounding app
  // didn't customize urlPrefix). If it's not empty we need to call
  // setUrlPrefix to ensure FBAdSettings's configuration is appropriately
  // cleared before yielding to another app.
  if ([FBAdSettings.urlPrefix length] > 0) {
    [FBAdSettings setUrlPrefix:nil];
  }
  [FBAdSettings setLogLevel:FBAdLogLevelLog];
  [FBAdSettings clearTestDevices];
}

- (NSDictionary *)constantsToExport
{
  return @{ @"currentDeviceHash": [FBAdSettings testDeviceHash] };
}

@end

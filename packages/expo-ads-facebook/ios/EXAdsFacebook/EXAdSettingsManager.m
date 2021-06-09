#import <EXAdsFacebook/EXAdSettingsManager.h>
#import <EXAdsFacebook/EXFacebookAdsAppTrackingPermissionRequester.h>

#import <FBAudienceNetwork/FBAudienceNetwork.h>

#import <UMCore/UMAppLifecycleService.h>
#import <ExpoModulesCore/EXPermissionsInterface.h>
#import <ExpoModulesCore/EXPermissionsMethodsDelegate.h>

@interface EXAdSettingsManager ()

@property (nonatomic) BOOL isChildDirected;
@property (nonatomic, strong) NSString *mediationService;
@property (nonatomic, strong, nullable) NSString *urlPrefix;
@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<EXPermissionsInterface> permissionsManager;
@property (nonatomic) FBAdLogLevel logLevel;
@property (nonatomic, strong) NSMutableArray<NSString*> *testDevices;

@end

@implementation EXAdSettingsManager

UM_EXPORT_MODULE(CTKAdSettingsManager)

- (instancetype)init {
  if (self = [super init]) {
    _testDevices = [NSMutableArray new];
    _mediationService = @"";
  }
  return self;
}

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  [[_moduleRegistry getModuleImplementingProtocol:@protocol(UMAppLifecycleService)] registerAppLifecycleListener:self];
  
  _permissionsManager = [_moduleRegistry getModuleImplementingProtocol:@protocol(EXPermissionsInterface)];
  [EXPermissionsMethodsDelegate registerRequesters:@[[EXFacebookAdsAppTrackingPermissionRequester new]] withPermissionsManager:_permissionsManager];
}

UM_EXPORT_METHOD_AS(getPermissionsAsync,
                    getPermissionsAsync:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  [EXPermissionsMethodsDelegate getPermissionWithPermissionsManager:_permissionsManager
                                                      withRequester:[EXFacebookAdsAppTrackingPermissionRequester class]
                                                            resolve:resolve
                                                             reject:reject];
}

UM_EXPORT_METHOD_AS(requestPermissionsAsync,
                    requestPermissionsAsync:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  [EXPermissionsMethodsDelegate askForPermissionWithPermissionsManager:_permissionsManager
                                                         withRequester:[EXFacebookAdsAppTrackingPermissionRequester class]
                                                               resolve:resolve
                                                                reject:reject];
}

UM_EXPORT_METHOD_AS(setAdvertiserTrackingEnabled,
                    setAdvertiserTrackingEnabled:(BOOL)enabled
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  [FBAdSettings setAdvertiserTrackingEnabled:enabled];
  resolve(nil);
}

UM_EXPORT_METHOD_AS(addTestDevice,
                    addTestDevice:(NSString *)deviceHash
                    resolve:(UMPromiseResolveBlock)resolver
                    reject:(UMPromiseRejectBlock)rejecter)
{
  [FBAdSettings addTestDevice:deviceHash];
  [_testDevices addObject:deviceHash];
  resolver(nil);
}

UM_EXPORT_METHOD_AS(clearTestDevices,
                    clearTestDevicesWithResolver:(UMPromiseResolveBlock)resolver
                    reject:(UMPromiseRejectBlock)rejecter)
{
  [FBAdSettings clearTestDevices];
  [_testDevices removeAllObjects];
}

UM_EXPORT_METHOD_AS(setLogLevel,
                    setLogLevel:(NSString *)logLevelKey
                    resolve:(UMPromiseResolveBlock)resolver
                    reject:(UMPromiseRejectBlock)rejecter)
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

UM_EXPORT_METHOD_AS(setIsChildDirected,
                    setIsChildDirected:(BOOL)isDirected
                    resolve:(UMPromiseResolveBlock)resolver
                    reject:(UMPromiseRejectBlock)rejecter)
{
  [FBAdSettings setIsChildDirected:isDirected];
  _isChildDirected = isDirected;
  resolver(nil);
}

UM_EXPORT_METHOD_AS(setMeditationService,
                    setMediationService:(NSString *)mediationService
                    resolve:(UMPromiseResolveBlock)resolver
                    reject:(UMPromiseRejectBlock)rejecter)
{
  [FBAdSettings setMediationService:mediationService];
  _mediationService = mediationService;
  resolver(nil);
}

UM_EXPORT_METHOD_AS(setUrlPrefix,
                    setUrlPrefix:(NSString *)urlPrefix
                    resolve:(UMPromiseResolveBlock)resolver
                    reject:(UMPromiseRejectBlock)rejecter)
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

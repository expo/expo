#import <ABI41_0_0EXAdsFacebook/ABI41_0_0EXAdSettingsManager.h>
#import <ABI41_0_0EXAdsFacebook/ABI41_0_0EXFacebookAdsAppTrackingPermissionRequester.h>

#import <FBAudienceNetwork/FBAudienceNetwork.h>

#import <ABI41_0_0UMCore/ABI41_0_0UMAppLifecycleService.h>
#import <ABI41_0_0UMPermissionsInterface/ABI41_0_0UMPermissionsInterface.h>
#import <ABI41_0_0UMPermissionsInterface/ABI41_0_0UMPermissionsMethodsDelegate.h>

@interface ABI41_0_0EXAdSettingsManager ()

@property (nonatomic) BOOL isChildDirected;
@property (nonatomic, strong) NSString *mediationService;
@property (nonatomic, strong, nullable) NSString *urlPrefix;
@property (nonatomic, weak) ABI41_0_0UMModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<ABI41_0_0UMPermissionsInterface> permissionsManager;
@property (nonatomic) FBAdLogLevel logLevel;
@property (nonatomic, strong) NSMutableArray<NSString*> *testDevices;

@end

@implementation ABI41_0_0EXAdSettingsManager

ABI41_0_0UM_EXPORT_MODULE(CTKAdSettingsManager)

- (instancetype)init {
  if (self = [super init]) {
    _testDevices = [NSMutableArray new];
    _mediationService = @"";
  }
  return self;
}

- (void)setModuleRegistry:(ABI41_0_0UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  [[_moduleRegistry getModuleImplementingProtocol:@protocol(ABI41_0_0UMAppLifecycleService)] registerAppLifecycleListener:self];
  
  _permissionsManager = [_moduleRegistry getModuleImplementingProtocol:@protocol(ABI41_0_0UMPermissionsInterface)];
  [ABI41_0_0UMPermissionsMethodsDelegate registerRequesters:@[[ABI41_0_0EXFacebookAdsAppTrackingPermissionRequester new]] withPermissionsManager:_permissionsManager];
}

ABI41_0_0UM_EXPORT_METHOD_AS(getPermissionsAsync,
                    getPermissionsAsync:(ABI41_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI41_0_0UMPromiseRejectBlock)reject)
{
  [ABI41_0_0UMPermissionsMethodsDelegate getPermissionWithPermissionsManager:_permissionsManager
                                                      withRequester:[ABI41_0_0EXFacebookAdsAppTrackingPermissionRequester class]
                                                            resolve:resolve
                                                             reject:reject];
}

ABI41_0_0UM_EXPORT_METHOD_AS(requestPermissionsAsync,
                    requestPermissionsAsync:(ABI41_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI41_0_0UMPromiseRejectBlock)reject)
{
  [ABI41_0_0UMPermissionsMethodsDelegate askForPermissionWithPermissionsManager:_permissionsManager
                                                         withRequester:[ABI41_0_0EXFacebookAdsAppTrackingPermissionRequester class]
                                                               resolve:resolve
                                                                reject:reject];
}

ABI41_0_0UM_EXPORT_METHOD_AS(setAdvertiserTrackingEnabled,
                    setAdvertiserTrackingEnabled:(BOOL)enabled
                    resolve:(ABI41_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI41_0_0UMPromiseRejectBlock)reject)
{
  [FBAdSettings setAdvertiserTrackingEnabled:enabled];
  resolve(nil);
}

ABI41_0_0UM_EXPORT_METHOD_AS(addTestDevice,
                    addTestDevice:(NSString *)deviceHash
                    resolve:(ABI41_0_0UMPromiseResolveBlock)resolver
                    reject:(ABI41_0_0UMPromiseRejectBlock)rejecter)
{
  [FBAdSettings addTestDevice:deviceHash];
  [_testDevices addObject:deviceHash];
  resolver(nil);
}

ABI41_0_0UM_EXPORT_METHOD_AS(clearTestDevices,
                    clearTestDevicesWithResolver:(ABI41_0_0UMPromiseResolveBlock)resolver
                    reject:(ABI41_0_0UMPromiseRejectBlock)rejecter)
{
  [FBAdSettings clearTestDevices];
  [_testDevices removeAllObjects];
}

ABI41_0_0UM_EXPORT_METHOD_AS(setLogLevel,
                    setLogLevel:(NSString *)logLevelKey
                    resolve:(ABI41_0_0UMPromiseResolveBlock)resolver
                    reject:(ABI41_0_0UMPromiseRejectBlock)rejecter)
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

ABI41_0_0UM_EXPORT_METHOD_AS(setIsChildDirected,
                    setIsChildDirected:(BOOL)isDirected
                    resolve:(ABI41_0_0UMPromiseResolveBlock)resolver
                    reject:(ABI41_0_0UMPromiseRejectBlock)rejecter)
{
  [FBAdSettings setIsChildDirected:isDirected];
  _isChildDirected = isDirected;
  resolver(nil);
}

ABI41_0_0UM_EXPORT_METHOD_AS(setMeditationService,
                    setMediationService:(NSString *)mediationService
                    resolve:(ABI41_0_0UMPromiseResolveBlock)resolver
                    reject:(ABI41_0_0UMPromiseRejectBlock)rejecter)
{
  [FBAdSettings setMediationService:mediationService];
  _mediationService = mediationService;
  resolver(nil);
}

ABI41_0_0UM_EXPORT_METHOD_AS(setUrlPrefix,
                    setUrlPrefix:(NSString *)urlPrefix
                    resolve:(ABI41_0_0UMPromiseResolveBlock)resolver
                    reject:(ABI41_0_0UMPromiseRejectBlock)rejecter)
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

#import <ABI37_0_0EXAdsFacebook/ABI37_0_0EXAdSettingsManager.h>
#import <FBAudienceNetwork/FBAudienceNetwork.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMAppLifecycleService.h>

@interface ABI37_0_0EXAdSettingsManager ()

@property (nonatomic) BOOL isChildDirected;
@property (nonatomic, strong) NSString *mediationService;
@property (nonatomic, strong, nullable) NSString *urlPrefix;
@property (nonatomic, weak) ABI37_0_0UMModuleRegistry *moduleRegistry;
@property (nonatomic) FBAdLogLevel logLevel;
@property (nonatomic, strong) NSMutableArray<NSString*> *testDevices;

@end

@implementation ABI37_0_0EXAdSettingsManager

ABI37_0_0UM_EXPORT_MODULE(CTKAdSettingsManager)

- (instancetype)init {
  if (self = [super init]) {
    _testDevices = [NSMutableArray new];
    _mediationService = @"";
  }
  return self;
}

- (void)setModuleRegistry:(ABI37_0_0UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  [[_moduleRegistry getModuleImplementingProtocol:@protocol(ABI37_0_0UMAppLifecycleService)] registerAppLifecycleListener:self];
}

ABI37_0_0UM_EXPORT_METHOD_AS(addTestDevice,
                    addTestDevice:(NSString *)deviceHash
                    resolve:(ABI37_0_0UMPromiseResolveBlock)resolver
                    reject:(ABI37_0_0UMPromiseRejectBlock)rejecter)
{
  [FBAdSettings addTestDevice:deviceHash];
  [_testDevices addObject:deviceHash];
  resolver(nil);
}

ABI37_0_0UM_EXPORT_METHOD_AS(clearTestDevices,
                    clearTestDevicesWithResolver:(ABI37_0_0UMPromiseResolveBlock)resolver
                    reject:(ABI37_0_0UMPromiseRejectBlock)rejecter)
{
  [FBAdSettings clearTestDevices];
  [_testDevices removeAllObjects];
}

ABI37_0_0UM_EXPORT_METHOD_AS(setLogLevel,
                    setLogLevel:(NSString *)logLevelKey
                    resolve:(ABI37_0_0UMPromiseResolveBlock)resolver
                    reject:(ABI37_0_0UMPromiseRejectBlock)rejecter)
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

ABI37_0_0UM_EXPORT_METHOD_AS(setIsChildDirected,
                    setIsChildDirected:(BOOL)isDirected
                    resolve:(ABI37_0_0UMPromiseResolveBlock)resolver
                    reject:(ABI37_0_0UMPromiseRejectBlock)rejecter)
{
  [FBAdSettings setIsChildDirected:isDirected];
  _isChildDirected = isDirected;
  resolver(nil);
}

ABI37_0_0UM_EXPORT_METHOD_AS(setMeditationService,
                    setMediationService:(NSString *)mediationService
                    resolve:(ABI37_0_0UMPromiseResolveBlock)resolver
                    reject:(ABI37_0_0UMPromiseRejectBlock)rejecter)
{
  [FBAdSettings setMediationService:mediationService];
  _mediationService = mediationService;
  resolver(nil);
}

ABI37_0_0UM_EXPORT_METHOD_AS(setUrlPrefix,
                    setUrlPrefix:(NSString *)urlPrefix
                    resolve:(ABI37_0_0UMPromiseResolveBlock)resolver
                    reject:(ABI37_0_0UMPromiseRejectBlock)rejecter)
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

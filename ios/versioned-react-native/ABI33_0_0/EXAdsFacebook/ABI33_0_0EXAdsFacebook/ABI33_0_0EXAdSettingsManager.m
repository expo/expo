#import <ABI33_0_0EXAdsFacebook/ABI33_0_0EXAdSettingsManager.h>
#import <FBAudienceNetwork/FBAudienceNetwork.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMAppLifecycleService.h>

@interface ABI33_0_0EXAdSettingsManager ()

@property (nonatomic) BOOL isChildDirected;
@property (nonatomic, strong) NSString *mediationService;
@property (nonatomic, strong) NSString *urlPrefix;
@property (nonatomic, weak) ABI33_0_0UMModuleRegistry *moduleRegistry;
@property (nonatomic) FBAdLogLevel logLevel;
@property (nonatomic, strong) NSMutableArray<NSString*> *testDevices;

@end

@implementation ABI33_0_0EXAdSettingsManager

ABI33_0_0UM_EXPORT_MODULE(CTKAdSettingsManager)

- (instancetype)init {
  if (self = [super init]) {
    _testDevices = [NSMutableArray new];
    _urlPrefix = @"";
    _mediationService = @"";
  }
  return self;
}

- (void)setModuleRegistry:(ABI33_0_0UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  [[_moduleRegistry getModuleImplementingProtocol:@protocol(ABI33_0_0UMAppLifecycleService)] registerAppLifecycleListener:self];
}

ABI33_0_0UM_EXPORT_METHOD_AS(addTestDevice,
                    addTestDevice:(NSString *)deviceHash
                    resolve:(ABI33_0_0UMPromiseResolveBlock)resolver
                    reject:(ABI33_0_0UMPromiseRejectBlock)rejecter)
{
  [FBAdSettings addTestDevice:deviceHash];
  [_testDevices addObject:deviceHash];
  resolver(nil);
}

ABI33_0_0UM_EXPORT_METHOD_AS(clearTestDevices,
                    clearTestDevicesWithResolver:(ABI33_0_0UMPromiseResolveBlock)resolver
                    reject:(ABI33_0_0UMPromiseRejectBlock)rejecter)
{
  [FBAdSettings clearTestDevices];
  [_testDevices removeAllObjects];
}

ABI33_0_0UM_EXPORT_METHOD_AS(setLogLevel,
                    setLogLevel:(NSString *)logLevelKey
                    resolve:(ABI33_0_0UMPromiseResolveBlock)resolver
                    reject:(ABI33_0_0UMPromiseRejectBlock)rejecter)
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

ABI33_0_0UM_EXPORT_METHOD_AS(setIsChildDirected,
                    setIsChildDirected:(BOOL)isDirected
                    resolve:(ABI33_0_0UMPromiseResolveBlock)resolver
                    reject:(ABI33_0_0UMPromiseRejectBlock)rejecter)
{
  [FBAdSettings setIsChildDirected:isDirected];
  _isChildDirected = isDirected;
  resolver(nil);
}

ABI33_0_0UM_EXPORT_METHOD_AS(setMeditationService,
                    setMediationService:(NSString *)mediationService
                    resolve:(ABI33_0_0UMPromiseResolveBlock)resolver
                    reject:(ABI33_0_0UMPromiseRejectBlock)rejecter)
{
  [FBAdSettings setMediationService:mediationService];
  _mediationService = mediationService;
  resolver(nil);
}

ABI33_0_0UM_EXPORT_METHOD_AS(setUrlPrefix,
                    setUrlPrefix:(NSString *)urlPrefix
                    resolve:(ABI33_0_0UMPromiseResolveBlock)resolver
                    reject:(ABI33_0_0UMPromiseRejectBlock)rejecter)
{
  [FBAdSettings setUrlPrefix:urlPrefix];
  _urlPrefix = urlPrefix;
  resolver(nil);
}

-(void)onAppForegrounded
{
  [FBAdSettings setIsChildDirected:_isChildDirected];
  [FBAdSettings setMediationService:_mediationService];
  [FBAdSettings setUrlPrefix:_urlPrefix];
  [FBAdSettings setLogLevel:_logLevel];
  [FBAdSettings addTestDevices:_testDevices];
}

- (void)onAppBackgrounded
{
  [FBAdSettings setIsChildDirected:NO];
  [FBAdSettings setMediationService:@""];
  [FBAdSettings setUrlPrefix:@""];
  [FBAdSettings setLogLevel:FBAdLogLevelLog];
  [FBAdSettings clearTestDevices];
}

- (NSDictionary *)constantsToExport
{
  return @{ @"currentDeviceHash": [FBAdSettings testDeviceHash] };
}

@end

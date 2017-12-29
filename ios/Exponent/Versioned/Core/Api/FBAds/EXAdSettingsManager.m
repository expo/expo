#import "EXAdSettingsManager.h"
#import "EXUnversioned.h"

#import <FBAudienceNetwork/FBAudienceNetwork.h>
#import <React/RCTUtils.h>
#import <React/RCTConvert.h>

@implementation RCTConvert (EXNativeAdView)

RCT_ENUM_CONVERTER(FBAdLogLevel, (@{
  @"none": @(FBAdLogLevelNone),
  @"debug": @(FBAdLogLevelDebug),
  @"verbose": @(FBAdLogLevelVerbose),
  @"warning": @(FBAdLogLevelWarning),
  @"notification": @(FBAdLogLevelNotification),
  @"error": @(FBAdLogLevelError),
}), FBAdLogLevelLog, integerValue)

@end

@interface EXAdSettingsManager ()

@property (nonatomic) BOOL isChildDirected;
@property (nonatomic, strong) NSString *mediationService;
@property (nonatomic, strong) NSString *urlPrefix;
@property (nonatomic) FBAdLogLevel logLevel;
@property (nonatomic, strong) NSMutableArray<NSString*> *testDevices;

@end

@implementation EXAdSettingsManager

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE(CTKAdSettingsManager)

- (instancetype)init {
  if (self = [super init]) {
    _testDevices = [NSMutableArray new];
    _urlPrefix = @"";
    _mediationService = @"";
  }
  return self;
}

- (void)setBridge:(RCTBridge *)bridge
{
  _bridge = bridge;

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(bridgeDidForeground:)
                                               name:EX_UNVERSIONED(@"EXKernelBridgeDidForegroundNotification")
                                             object:self.bridge];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(bridgeDidBackground:)
                                               name:EX_UNVERSIONED(@"EXKernelBridgeDidBackgroundNotification")
                                             object:self.bridge];
}

RCT_EXPORT_METHOD(addTestDevice:(NSString *)deviceHash)
{
  [FBAdSettings addTestDevice:deviceHash];
  [_testDevices addObject:deviceHash];
}

RCT_EXPORT_METHOD(clearTestDevices)
{
  [FBAdSettings clearTestDevices];
  [_testDevices removeAllObjects];
}

RCT_EXPORT_METHOD(setLogLevel:(FBAdLogLevel)logLevel)
{
  [FBAdSettings setLogLevel:logLevel];
  _logLevel = logLevel;
}

RCT_EXPORT_METHOD(setIsChildDirected:(BOOL)isDirected)
{
  [FBAdSettings setIsChildDirected:isDirected];
  _isChildDirected = isDirected;
}

RCT_EXPORT_METHOD(setMediationService:(NSString *)mediationService)
{
  [FBAdSettings setMediationService:mediationService];
  _mediationService = mediationService;
}

RCT_EXPORT_METHOD(setUrlPrefix:(NSString *)urlPrefix)
{
  [FBAdSettings setUrlPrefix:urlPrefix];
  _urlPrefix = urlPrefix;
}

- (void)bridgeDidForeground:(NSNotification *)notification
{
  [FBAdSettings setIsChildDirected:_isChildDirected];
  [FBAdSettings setMediationService:_mediationService];
  [FBAdSettings setUrlPrefix:_urlPrefix];
  [FBAdSettings setLogLevel:_logLevel];
  [FBAdSettings addTestDevices:_testDevices];
}

- (void)bridgeDidBackground:(NSNotification *)notification
{
  [FBAdSettings setIsChildDirected:NO];
  [FBAdSettings setMediationService:@""];
  [FBAdSettings setUrlPrefix:@""];
  [FBAdSettings setLogLevel:FBAdLogLevelLog];
  [FBAdSettings clearTestDevices];
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (NSDictionary *)constantsToExport
{
  return @{ @"currentDeviceHash": [FBAdSettings testDeviceHash] };
}

@end

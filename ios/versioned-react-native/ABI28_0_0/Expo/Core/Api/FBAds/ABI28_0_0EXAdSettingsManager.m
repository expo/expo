#import "ABI28_0_0EXAdSettingsManager.h"
#import "ABI28_0_0EXUnversioned.h"

#import <FBAudienceNetwork/FBAudienceNetwork.h>
#import <ReactABI28_0_0/ABI28_0_0RCTUtils.h>
#import <ReactABI28_0_0/ABI28_0_0RCTConvert.h>

@implementation ABI28_0_0RCTConvert (ABI28_0_0EXNativeAdView)

ABI28_0_0RCT_ENUM_CONVERTER(FBAdLogLevel, (@{
  @"none": @(FBAdLogLevelNone),
  @"debug": @(FBAdLogLevelDebug),
  @"verbose": @(FBAdLogLevelVerbose),
  @"warning": @(FBAdLogLevelWarning),
  @"notification": @(FBAdLogLevelNotification),
  @"error": @(FBAdLogLevelError),
}), FBAdLogLevelLog, integerValue)

@end

@interface ABI28_0_0EXAdSettingsManager ()

@property (nonatomic) BOOL isChildDirected;
@property (nonatomic, strong) NSString *mediationService;
@property (nonatomic, strong) NSString *urlPrefix;
@property (nonatomic) FBAdLogLevel logLevel;
@property (nonatomic, strong) NSMutableArray<NSString*> *testDevices;

@end

@implementation ABI28_0_0EXAdSettingsManager

@synthesize bridge = _bridge;

ABI28_0_0RCT_EXPORT_MODULE(CTKAdSettingsManager)

- (instancetype)init {
  if (self = [super init]) {
    _testDevices = [NSMutableArray new];
    _urlPrefix = @"";
    _mediationService = @"";
  }
  return self;
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (void)setBridge:(ABI28_0_0RCTBridge *)bridge
{
  _bridge = bridge;

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(bridgeDidForeground:)
                                               name:@"EXKernelBridgeDidForegroundNotification"
                                             object:self.bridge];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(bridgeDidBackground:)
                                               name:@"EXKernelBridgeDidBackgroundNotification"
                                             object:self.bridge];
}

ABI28_0_0RCT_EXPORT_METHOD(addTestDevice:(NSString *)deviceHash)
{
  [FBAdSettings addTestDevice:deviceHash];
  [_testDevices addObject:deviceHash];
}

ABI28_0_0RCT_EXPORT_METHOD(clearTestDevices)
{
  [FBAdSettings clearTestDevices];
  [_testDevices removeAllObjects];
}

ABI28_0_0RCT_EXPORT_METHOD(setLogLevel:(FBAdLogLevel)logLevel)
{
  [FBAdSettings setLogLevel:logLevel];
  _logLevel = logLevel;
}

ABI28_0_0RCT_EXPORT_METHOD(setIsChildDirected:(BOOL)isDirected)
{
  [FBAdSettings setIsChildDirected:isDirected];
  _isChildDirected = isDirected;
}

ABI28_0_0RCT_EXPORT_METHOD(setMediationService:(NSString *)mediationService)
{
  [FBAdSettings setMediationService:mediationService];
  _mediationService = mediationService;
}

ABI28_0_0RCT_EXPORT_METHOD(setUrlPrefix:(NSString *)urlPrefix)
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

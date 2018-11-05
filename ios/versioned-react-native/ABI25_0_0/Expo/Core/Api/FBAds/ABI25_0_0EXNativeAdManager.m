
#import "ABI25_0_0EXFacebook.h"
#import "ABI25_0_0EXNativeAdManager.h"
#import "ABI25_0_0EXNativeAdView.h"
#import "ABI25_0_0EXNativeAdEmitter.h"

#import <FBAudienceNetwork/FBAudienceNetwork.h>
#import <ReactABI25_0_0/ABI25_0_0RCTUtils.h>
#import <ReactABI25_0_0/ABI25_0_0RCTAssert.h>
#import <ReactABI25_0_0/ABI25_0_0RCTBridge.h>
#import <ReactABI25_0_0/ABI25_0_0RCTConvert.h>

@implementation ABI25_0_0RCTConvert (ABI25_0_0EXNativeAdView)

ABI25_0_0RCT_ENUM_CONVERTER(FBNativeAdsCachePolicy, (@{
  @"none": @(FBNativeAdsCachePolicyNone),
  @"all": @(FBNativeAdsCachePolicyAll),
}), FBNativeAdsCachePolicyNone, integerValue)

@end

@interface ABI25_0_0EXNativeAdManager () <FBNativeAdsManagerDelegate>

@property (nonatomic, strong) NSMutableDictionary<NSString*, FBNativeAdsManager*> *adsManagers;

@end

@implementation ABI25_0_0EXNativeAdManager

ABI25_0_0RCT_EXPORT_MODULE(CTKNativeAdManager)

@synthesize bridge = _bridge;

- (instancetype)init
{
  self = [super init];
  if (self) {
    _adsManagers = [NSMutableDictionary new];
  }
  return self;
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

ABI25_0_0RCT_EXPORT_METHOD(init:(NSString *)placementId withAdsToRequest:(nonnull NSNumber *)adsToRequest)
{
  if (![ABI25_0_0EXFacebook facebookAppIdFromNSBundle]) {
    ABI25_0_0RCTLogWarn(@"No Facebook app id is specified. Facebook ads may have undefined behavior.");
  }
  FBNativeAdsManager *adsManager = [[FBNativeAdsManager alloc] initWithPlacementID:placementId
                                                                forNumAdsRequested:[adsToRequest intValue]];

  [adsManager setDelegate:self];

  [adsManager loadAds];

  [_adsManagers setValue:adsManager forKey:placementId];
}

ABI25_0_0RCT_EXPORT_METHOD(setMediaCachePolicy:(NSString*)placementId cachePolicy:(FBNativeAdsCachePolicy)cachePolicy)
{
  [_adsManagers[placementId] setMediaCachePolicy:cachePolicy];
}

ABI25_0_0RCT_EXPORT_METHOD(disableAutoRefresh:(NSString*)placementId)
{
  [_adsManagers[placementId] disableAutoRefresh];
}

- (void)nativeAdsLoaded
{
  NSMutableDictionary<NSString*, NSNumber*> *adsManagersState = [NSMutableDictionary new];

  [_adsManagers enumerateKeysAndObjectsUsingBlock:^(NSString* key, FBNativeAdsManager* adManager, __unused BOOL* stop) {
    [adsManagersState setValue:@([adManager isValid]) forKey:key];
  }];
  
  ABI25_0_0EXNativeAdEmitter *nativeAdEmitter = [_bridge moduleForClass:[ABI25_0_0EXNativeAdEmitter class]];
  [nativeAdEmitter sendManagersState:adsManagersState];
}

- (void)nativeAdsFailedToLoadWithError:(NSError *)errors
{
  // @todo handle errors here
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (UIView *)view
{
  return [ABI25_0_0EXNativeAdView new];
}

ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(onAdLoaded, ABI25_0_0RCTBubblingEventBlock)
ABI25_0_0RCT_CUSTOM_VIEW_PROPERTY(adsManager, NSString, ABI25_0_0EXNativeAdView)
{
  view.nativeAd = [_adsManagers[json] nextNativeAd];
}

@end

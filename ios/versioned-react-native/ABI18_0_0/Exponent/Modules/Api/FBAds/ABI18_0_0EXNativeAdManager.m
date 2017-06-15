
#import "ABI18_0_0EXNativeAdManager.h"
#import "ABI18_0_0EXNativeAdView.h"
#import "ABI18_0_0EXNativeAdEmitter.h"

#import <FBAudienceNetwork/FBAudienceNetwork.h>
#import <ReactABI18_0_0/ABI18_0_0RCTUtils.h>
#import <ReactABI18_0_0/ABI18_0_0RCTAssert.h>
#import <ReactABI18_0_0/ABI18_0_0RCTBridge.h>
#import <ReactABI18_0_0/ABI18_0_0RCTConvert.h>

@implementation ABI18_0_0RCTConvert (ABI18_0_0EXNativeAdView)

ABI18_0_0RCT_ENUM_CONVERTER(FBNativeAdsCachePolicy, (@{
  @"none": @(FBNativeAdsCachePolicyNone),
  @"icon": @(FBNativeAdsCachePolicyIcon),
  @"image": @(FBNativeAdsCachePolicyCoverImage),
  @"all": @(FBNativeAdsCachePolicyAll),
}), FBNativeAdsCachePolicyNone, integerValue)

@end

@interface ABI18_0_0EXNativeAdManager () <FBNativeAdsManagerDelegate>

@property (nonatomic, strong) NSMutableDictionary<NSString*, FBNativeAdsManager*> *adsManagers;

@end

@implementation ABI18_0_0EXNativeAdManager

ABI18_0_0RCT_EXPORT_MODULE(CTKNativeAdManager)

@synthesize bridge = _bridge;

- (instancetype)init
{
  self = [super init];
  if (self) {
    _adsManagers = [NSMutableDictionary new];
  }
  return self;
}

ABI18_0_0RCT_EXPORT_METHOD(init:(NSString *)placementId withAdsToRequest:(nonnull NSNumber *)adsToRequest)
{
  FBNativeAdsManager *adsManager = [[FBNativeAdsManager alloc] initWithPlacementID:placementId
                                                                forNumAdsRequested:[adsToRequest intValue]];

  [adsManager setDelegate:self];

  [adsManager loadAds];

  [_adsManagers setValue:adsManager forKey:placementId];
}

ABI18_0_0RCT_EXPORT_METHOD(setMediaCachePolicy:(NSString*)placementId cachePolicy:(FBNativeAdsCachePolicy)cachePolicy)
{
  [_adsManagers[placementId] setMediaCachePolicy:cachePolicy];
}

ABI18_0_0RCT_EXPORT_METHOD(disableAutoRefresh:(NSString*)placementId)
{
  [_adsManagers[placementId] disableAutoRefresh];
}

- (void)nativeAdsLoaded
{
  NSMutableDictionary<NSString*, NSNumber*> *adsManagersState = [NSMutableDictionary new];

  [_adsManagers enumerateKeysAndObjectsUsingBlock:^(NSString* key, FBNativeAdsManager* adManager, __unused BOOL* stop) {
    [adsManagersState setValue:@([adManager isValid]) forKey:key];
  }];
  
  ABI18_0_0EXNativeAdEmitter *nativeAdEmitter = [_bridge moduleForClass:[ABI18_0_0EXNativeAdEmitter class]];
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
  return [ABI18_0_0EXNativeAdView new];
}

ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(onAdLoaded, ABI18_0_0RCTBubblingEventBlock)
ABI18_0_0RCT_CUSTOM_VIEW_PROPERTY(adsManager, NSString, ABI18_0_0EXNativeAdView)
{
  view.nativeAd = [_adsManagers[json] nextNativeAd];
}

@end

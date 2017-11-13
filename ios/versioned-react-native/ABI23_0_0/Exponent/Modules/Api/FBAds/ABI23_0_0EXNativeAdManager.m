
#import "ABI23_0_0EXNativeAdManager.h"
#import "ABI23_0_0EXNativeAdView.h"
#import "ABI23_0_0EXNativeAdEmitter.h"

#import <FBAudienceNetwork/FBAudienceNetwork.h>
#import <ReactABI23_0_0/ABI23_0_0RCTUtils.h>
#import <ReactABI23_0_0/ABI23_0_0RCTAssert.h>
#import <ReactABI23_0_0/ABI23_0_0RCTBridge.h>
#import <ReactABI23_0_0/ABI23_0_0RCTConvert.h>

@implementation ABI23_0_0RCTConvert (ABI23_0_0EXNativeAdView)

ABI23_0_0RCT_ENUM_CONVERTER(FBNativeAdsCachePolicy, (@{
  @"none": @(FBNativeAdsCachePolicyNone),
  @"icon": @(FBNativeAdsCachePolicyIcon),
  @"image": @(FBNativeAdsCachePolicyCoverImage),
  @"all": @(FBNativeAdsCachePolicyAll),
}), FBNativeAdsCachePolicyNone, integerValue)

@end

@interface ABI23_0_0EXNativeAdManager () <FBNativeAdsManagerDelegate>

@property (nonatomic, strong) NSMutableDictionary<NSString*, FBNativeAdsManager*> *adsManagers;

@end

@implementation ABI23_0_0EXNativeAdManager

ABI23_0_0RCT_EXPORT_MODULE(CTKNativeAdManager)

@synthesize bridge = _bridge;

- (instancetype)init
{
  self = [super init];
  if (self) {
    _adsManagers = [NSMutableDictionary new];
  }
  return self;
}

ABI23_0_0RCT_EXPORT_METHOD(init:(NSString *)placementId withAdsToRequest:(nonnull NSNumber *)adsToRequest)
{
  FBNativeAdsManager *adsManager = [[FBNativeAdsManager alloc] initWithPlacementID:placementId
                                                                forNumAdsRequested:[adsToRequest intValue]];

  [adsManager setDelegate:self];

  [adsManager loadAds];

  [_adsManagers setValue:adsManager forKey:placementId];
}

ABI23_0_0RCT_EXPORT_METHOD(setMediaCachePolicy:(NSString*)placementId cachePolicy:(FBNativeAdsCachePolicy)cachePolicy)
{
  [_adsManagers[placementId] setMediaCachePolicy:cachePolicy];
}

ABI23_0_0RCT_EXPORT_METHOD(disableAutoRefresh:(NSString*)placementId)
{
  [_adsManagers[placementId] disableAutoRefresh];
}

- (void)nativeAdsLoaded
{
  NSMutableDictionary<NSString*, NSNumber*> *adsManagersState = [NSMutableDictionary new];

  [_adsManagers enumerateKeysAndObjectsUsingBlock:^(NSString* key, FBNativeAdsManager* adManager, __unused BOOL* stop) {
    [adsManagersState setValue:@([adManager isValid]) forKey:key];
  }];
  
  ABI23_0_0EXNativeAdEmitter *nativeAdEmitter = [_bridge moduleForClass:[ABI23_0_0EXNativeAdEmitter class]];
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
  return [ABI23_0_0EXNativeAdView new];
}

ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(onAdLoaded, ABI23_0_0RCTBubblingEventBlock)
ABI23_0_0RCT_CUSTOM_VIEW_PROPERTY(adsManager, NSString, ABI23_0_0EXNativeAdView)
{
  view.nativeAd = [_adsManagers[json] nextNativeAd];
}

@end

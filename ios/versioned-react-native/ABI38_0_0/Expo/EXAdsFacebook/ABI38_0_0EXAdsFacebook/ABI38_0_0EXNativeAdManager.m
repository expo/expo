#import <ABI38_0_0EXAdsFacebook/ABI38_0_0EXNativeAdManager.h>
#import <ABI38_0_0EXAdsFacebook/ABI38_0_0EXNativeAdView.h>

#import <FBAudienceNetwork/FBAudienceNetwork.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMUtilities.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMUIManager.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMEventEmitterService.h>

@interface ABI38_0_0EXNativeAdManager () <FBNativeAdsManagerDelegate>

@property (nonatomic, weak) ABI38_0_0UMModuleRegistry *moduleRegistry;
@property (nonatomic, strong) NSMutableDictionary<NSString*, FBNativeAdsManager*> *adsManagers;

@end

@implementation ABI38_0_0EXNativeAdManager

ABI38_0_0UM_EXPORT_MODULE(CTKNativeAdManager)

- (instancetype)init
{
  self = [super init];
  if (self) {
    _adsManagers = [NSMutableDictionary new];
  }
  return self;
}

- (NSString *)viewName
{
  return @"CTKNativeAd";
}

- (void)setModuleRegistry:(ABI38_0_0UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"CTKNativeAdsManagersChanged", @"onAdLoaded"];
}

ABI38_0_0UM_EXPORT_METHOD_AS(registerViewsForInteraction,
                    registerViewsForInteraction:(NSNumber *)nativeAdViewTag
                    mediaViewTag:(NSNumber *)mediaViewTag
                    adIconViewTag:(NSNumber *)adIconViewTag
                    clickableViewsTags:(NSArray *)tags
                    resolve:(ABI38_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI38_0_0UMPromiseRejectBlock)reject)
{
  id<ABI38_0_0UMUIManager> uiManager = [_moduleRegistry getModuleImplementingProtocol:@protocol(ABI38_0_0UMUIManager)];
  [uiManager executeUIBlock:^(NSDictionary<id,UIView *> * viewRegistry) {
    UIView *mediaView = nil;
    UIView *adIconView = nil;
    UIView *nativeAdView = nil;
    NSMutableArray<UIView *> *clickableViews = [NSMutableArray new];

    mediaView = viewRegistry[mediaViewTag];
    adIconView = viewRegistry[adIconViewTag];
    nativeAdView = viewRegistry[nativeAdViewTag];
    for (id tag in tags) {
      if (viewRegistry[tag]) {
        [clickableViews addObject:viewRegistry[tag]];
      }
    }

    if (!clickableViews) {
      reject(@"E_INVALID_VIEW_TAG", @"Could not find view for one of the clickable views tags", nil);
      return;
    }

    if (mediaView == nil) {
      reject(@"E_NO_VIEW_FOR_TAG", @"Could not find mediaView", nil);
      return;
    }

    if (nativeAdView == nil) {
      reject(@"E_NO_NATIVEAD_VIEW", @"Could not find nativeAdView", nil);
      return;
    }

    if (![mediaView isKindOfClass:[FBMediaView class]]) {
      reject(@"E_INVALID_VIEW_CLASS", @"View returned for passed media view tag is not an instance of FBMediaView", nil);
      return;
    }

    if (![nativeAdView isKindOfClass:[ABI38_0_0EXNativeAdView class]]) {
      reject(@"E_INVALID_VIEW_CLASS", @"View returned for passed native ad view tag is not an instance of ABI38_0_0EXNativeAdView", nil);
      return;
    }

    if (adIconView) {
      if (![adIconView isKindOfClass:[FBMediaView class]]) {
        reject(@"E_INVALID_VIEW_CLASS", @"View returned for passed ad icon view tag is not an instance of FBMediaView", nil);
        return;
      }
    }

    [clickableViews addObject:mediaView];
    [clickableViews addObject:adIconView];

    [(ABI38_0_0EXNativeAdView *)nativeAdView registerViewsForInteraction:(FBMediaView *)mediaView adIcon:(FBAdIconView *)adIconView clickableViews:clickableViews];
    resolve(@[]);
  }];
}

ABI38_0_0UM_EXPORT_METHOD_AS(init,
                    init:(NSString *)placementId
                    withAdsToRequest:(NSNumber *)adsToRequest
                    resolve:(ABI38_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI38_0_0UMPromiseRejectBlock)reject)
{
  FBNativeAdsManager *adsManager = [[FBNativeAdsManager alloc] initWithPlacementID:placementId
                                                                forNumAdsRequested:[adsToRequest intValue]];

  [adsManager setDelegate:self];

  [ABI38_0_0UMUtilities performSynchronouslyOnMainThread:^{
    [adsManager loadAds];
  }];

  [_adsManagers setValue:adsManager forKey:placementId];
  resolve(nil);
}

ABI38_0_0UM_EXPORT_METHOD_AS(setMediaCachePolicy,
                    setMediaCachePolicy:(NSString *)placementId
                    cachePolicy:(NSString *)cachePolicy
                    resolve:(ABI38_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI38_0_0UMPromiseRejectBlock)reject)
{
  FBNativeAdsCachePolicy policy = [@{
                                     @"none": @(FBNativeAdsCachePolicyNone),
                                     @"all": @(FBNativeAdsCachePolicyAll),
                                     }[cachePolicy] integerValue] ?: FBNativeAdsCachePolicyNone;
  [_adsManagers[placementId] setMediaCachePolicy:policy];
  resolve(nil);
}

ABI38_0_0UM_EXPORT_METHOD_AS(disableAutoRefresh,
                    disableAutoRefresh:(NSString*)placementId
                    resolve:(ABI38_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI38_0_0UMPromiseRejectBlock)reject)
{
  [_adsManagers[placementId] disableAutoRefresh];
  resolve(nil);
}

- (void)nativeAdsLoaded
{
  NSMutableDictionary<NSString*, NSNumber*> *adsManagersState = [NSMutableDictionary new];

  [_adsManagers enumerateKeysAndObjectsUsingBlock:^(NSString* key, FBNativeAdsManager* adManager, __unused BOOL* stop) {
    [adsManagersState setValue:@([adManager isValid]) forKey:key];
  }];

  [[_moduleRegistry getModuleImplementingProtocol:@protocol(ABI38_0_0UMEventEmitterService)] sendEventWithName:@"CTKNativeAdsManagersChanged" body:adsManagersState];
}

- (void)nativeAdsFailedToLoadWithError:(NSError *)errors
{
  // @todo handle errors here
}

- (UIView *)view
{
  return [[ABI38_0_0EXNativeAdView alloc] initWithModuleRegistry:_moduleRegistry];
}

ABI38_0_0UM_VIEW_PROPERTY(adsManager, NSString *, ABI38_0_0EXNativeAdView)
{
  [view setNativeAd:[_adsManagers[value] nextNativeAd]];
}

- (void)startObserving {
}

- (void)stopObserving {
}

@end

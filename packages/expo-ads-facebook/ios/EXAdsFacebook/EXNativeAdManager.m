
#import <EXAdsFacebook/EXFacebookAdHelper.h>
#import <EXAdsFacebook/EXNativeAdManager.h>
#import <EXAdsFacebook/EXNativeAdView.h>

#import <FBAudienceNetwork/FBAudienceNetwork.h>
#import <UMCore/UMUtilities.h>
#import <UMCore/UMUIManager.h>
#import <UMCore/UMEventEmitterService.h>

@interface EXNativeAdManager () <FBNativeAdsManagerDelegate>

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;
@property (nonatomic, strong) NSMutableDictionary<NSString*, FBNativeAdsManager*> *adsManagers;

@end

@implementation EXNativeAdManager

UM_EXPORT_MODULE(CTKNativeAdManager)

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

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"CTKNativeAdsManagersChanged", @"onAdLoaded"];
}

UM_EXPORT_METHOD_AS(registerViewsForInteraction,
                    registerViewsForInteraction:(NSNumber *)nativeAdViewTag
                    mediaViewTag:(NSNumber *)mediaViewTag
                    adIconViewTag:(NSNumber *)adIconViewTag
                    clickableViewsTags:(NSArray *)tags
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  id<UMUIManager> uiManager = [_moduleRegistry getModuleImplementingProtocol:@protocol(UMUIManager)];
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
      } else {
        clickableViews = nil;
        break;
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

    if (![nativeAdView isKindOfClass:[EXNativeAdView class]]) {
      reject(@"E_INVALID_VIEW_CLASS", @"View returned for passed native ad view tag is not an instance of EXNativeAdView", nil);
      return;
    }

    if (adIconView) {
      if (![adIconView isKindOfClass:[FBAdIconView class]]) {
        reject(@"E_INVALID_VIEW_CLASS", @"View returned for passed ad icon view tag is not an instance of FBAdIconView", nil);
        return;
      }
    }

    [(EXNativeAdView *)nativeAdView registerViewsForInteraction:(FBMediaView *)mediaView adIcon:(FBAdIconView *)adIconView clickableViews:clickableViews];
    resolve(@[]);
  }];
}

UM_EXPORT_METHOD_AS(init,
                    init:(NSString *)placementId
                    withAdsToRequest:(NSNumber *)adsToRequest
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  if (![EXFacebookAdHelper facebookAppIdFromNSBundle]) {
    UMLogWarn(@"No Facebook app id is specified. Facebook ads may have undefined behavior.");
  }
  FBNativeAdsManager *adsManager = [[FBNativeAdsManager alloc] initWithPlacementID:placementId
                                                                forNumAdsRequested:[adsToRequest intValue]];

  [adsManager setDelegate:self];

  [UMUtilities performSynchronouslyOnMainThread:^{
    [adsManager loadAds];
  }];

  [_adsManagers setValue:adsManager forKey:placementId];
  resolve(nil);
}

UM_EXPORT_METHOD_AS(setMediaCachePolicy,
                    setMediaCachePolicy:(NSString *)placementId
                    cachePolicy:(NSString *)cachePolicy
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  FBNativeAdsCachePolicy policy = [@{
                                     @"none": @(FBNativeAdsCachePolicyNone),
                                     @"all": @(FBNativeAdsCachePolicyAll),
                                     }[cachePolicy] integerValue] ?: FBNativeAdsCachePolicyNone;
  [_adsManagers[placementId] setMediaCachePolicy:policy];
  resolve(nil);
}

UM_EXPORT_METHOD_AS(disableAutoRefresh,
                    disableAutoRefresh:(NSString*)placementId
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
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

  [[_moduleRegistry getModuleImplementingProtocol:@protocol(UMEventEmitterService)] sendEventWithName:@"CTKNativeAdsManagersChanged" body:adsManagersState];
}

- (void)nativeAdsFailedToLoadWithError:(NSError *)errors
{
  // @todo handle errors here
}

- (UIView *)view
{
  return [[EXNativeAdView alloc] initWithModuleRegistry:_moduleRegistry];
}

UM_VIEW_PROPERTY(adsManager, NSString *, EXNativeAdView)
{
  [view setNativeAd:[_adsManagers[value] nextNativeAd]];
}

- (void)startObserving {
}

- (void)stopObserving {
}

@end

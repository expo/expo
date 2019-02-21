
#import <EXAdsFacebook/EXFacebookAdHelper.h>
#import <EXAdsFacebook/EXNativeAdManager.h>
#import <EXAdsFacebook/EXNativeAdView.h>

#import <FBAudienceNetwork/FBAudienceNetwork.h>
#import <EXCore/EXUtilities.h>
#import <EXCore/EXUIManager.h>
#import <EXCore/EXEventEmitterService.h>

@interface EXNativeAdManager () <FBNativeAdsManagerDelegate>

@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;
@property (nonatomic, strong) NSMutableDictionary<NSString*, FBNativeAdsManager*> *adsManagers;

@end

@implementation EXNativeAdManager

EX_EXPORT_MODULE(CTKNativeAdManager)

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

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"CTKNativeAdsManagersChanged", @"onAdLoaded"];
}

EX_EXPORT_METHOD_AS(registerViewsForInteraction,
                    registerViewsForInteraction:(NSNumber *)nativeAdViewTag
                    mediaViewTag:(NSNumber *)mediaViewTag
                    adIconViewTag:(NSNumber *)adIconViewTag
                    clickableViewsTags:(NSArray *)tags
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  id<EXUIManager> uiManager = [_moduleRegistry getModuleImplementingProtocol:@protocol(EXUIManager)];
  [uiManager addUIBlock:^(NSDictionary<id,UIView *> * viewRegistry) {
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

EX_EXPORT_METHOD_AS(init,
                    init:(NSString *)placementId
                    withAdsToRequest:(NSNumber *)adsToRequest
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  if (![EXFacebookAdHelper facebookAppIdFromNSBundle]) {
    EXLogWarn(@"No Facebook app id is specified. Facebook ads may have undefined behavior.");
  }
  FBNativeAdsManager *adsManager = [[FBNativeAdsManager alloc] initWithPlacementID:placementId
                                                                forNumAdsRequested:[adsToRequest intValue]];

  [adsManager setDelegate:self];

  [EXUtilities performSynchronouslyOnMainThread:^{
    [adsManager loadAds];
  }];

  [_adsManagers setValue:adsManager forKey:placementId];
  resolve(nil);
}

EX_EXPORT_METHOD_AS(setMediaCachePolicy,
                    setMediaCachePolicy:(NSString *)placementId
                    cachePolicy:(NSString *)cachePolicy
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  FBNativeAdsCachePolicy policy = [@{
                                     @"none": @(FBNativeAdsCachePolicyNone),
                                     @"all": @(FBNativeAdsCachePolicyAll),
                                     }[cachePolicy] integerValue] ?: FBNativeAdsCachePolicyNone;
  [_adsManagers[placementId] setMediaCachePolicy:policy];
  resolve(nil);
}

EX_EXPORT_METHOD_AS(disableAutoRefresh,
                    disableAutoRefresh:(NSString*)placementId
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
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

  [[_moduleRegistry getModuleImplementingProtocol:@protocol(EXEventEmitterService)] sendEventWithName:@"CTKNativeAdsManagersChanged" body:adsManagersState];
}

- (void)nativeAdsFailedToLoadWithError:(NSError *)errors
{
  // @todo handle errors here
}

- (UIView *)view
{
  return [[EXNativeAdView alloc] initWithModuleRegistry:_moduleRegistry];
}

EX_VIEW_PROPERTY(adsManager, NSString *, EXNativeAdView)
{
  [view setNativeAd:[_adsManagers[value] nextNativeAd]];
}

- (void)startObserving {
}

- (void)stopObserving {
}

@end

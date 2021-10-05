#import <ABI43_0_0EXAdsFacebook/ABI43_0_0EXNativeAdManager.h>
#import <ABI43_0_0EXAdsFacebook/ABI43_0_0EXNativeAdView.h>

#import <FBAudienceNetwork/FBAudienceNetwork.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXUtilities.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXUIManager.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXEventEmitterService.h>

@class ABI43_0_0EXAdManagerDelegate;

@interface ABI43_0_0EXNativeAdManager ()

@property (nonatomic, weak) ABI43_0_0EXModuleRegistry *moduleRegistry;
@property (nonatomic, strong) NSMutableDictionary<NSString*, FBNativeAdsManager*> *adsManagers;
@property (nonatomic, strong) NSMutableDictionary<NSString*, ABI43_0_0EXAdManagerDelegate*> *adsManagersDelegates;

- (void)nativeAdsLoaded;
- (void)nativeAdForPlacementId:(NSString *)placementId failedToLoadWithError:(NSError *)error;

@end

// A light delegate object responsible for delivering information
// about errors to ABI43_0_0EXNativeAdManager, but with a specific placement ID
// for which the error has happened. FBNativeAdsManagerDelegate protocol
// does not provide such information, we only get the error. Proxying
// the event through this middleman lets us assign specific placement ID
// to each error.

@interface ABI43_0_0EXAdManagerDelegate : NSObject <FBNativeAdsManagerDelegate>

@property (nonatomic, weak) ABI43_0_0EXNativeAdManager *manager;
@property (nonatomic, strong) NSString *placementId;

@end

@implementation ABI43_0_0EXAdManagerDelegate

- (instancetype)initWithPlacementId:(NSString *)placementId andManager:(ABI43_0_0EXNativeAdManager *)manager
{
  if (self = [super init]) {
    _manager = manager;
    _placementId = placementId;
  }
  return self;
}

- (void)nativeAdsLoaded
{
  [_manager nativeAdsLoaded];
}

- (void)nativeAdsFailedToLoadWithError:(NSError *)errors
{
  [_manager nativeAdForPlacementId:_placementId failedToLoadWithError:errors];
}

@end

@implementation ABI43_0_0EXNativeAdManager

ABI43_0_0EX_EXPORT_MODULE(CTKNativeAdManager)

- (instancetype)init
{
  self = [super init];
  if (self) {
    _adsManagers = [NSMutableDictionary new];
    _adsManagersDelegates = [NSMutableDictionary new];
  }
  return self;
}

- (NSString *)viewName
{
  return @"CTKNativeAd";
}

- (void)setModuleRegistry:(ABI43_0_0EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"CTKNativeAdsManagersChanged", @"CTKNativeAdManagerErrored", @"onAdLoaded"];
}

ABI43_0_0EX_EXPORT_METHOD_AS(registerViewsForInteraction,
                    registerViewsForInteraction:(NSNumber *)nativeAdViewTag
                    mediaViewTag:(NSNumber *)mediaViewTag
                    adIconViewTag:(NSNumber *)adIconViewTag
                    clickableViewsTags:(NSArray *)tags
                    resolve:(ABI43_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  id<ABI43_0_0EXUIManager> uiManager = [_moduleRegistry getModuleImplementingProtocol:@protocol(ABI43_0_0EXUIManager)];
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

    if (![nativeAdView isKindOfClass:[ABI43_0_0EXNativeAdView class]]) {
      reject(@"E_INVALID_VIEW_CLASS", @"View returned for passed native ad view tag is not an instance of ABI43_0_0EXNativeAdView", nil);
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

    [(ABI43_0_0EXNativeAdView *)nativeAdView registerViewsForInteraction:(FBMediaView *)mediaView adIcon:(FBAdIconView *)adIconView clickableViews:clickableViews];
    resolve(@[]);
  }];
}

ABI43_0_0EX_EXPORT_METHOD_AS(init,
                    init:(NSString *)placementId
                    withAdsToRequest:(NSNumber *)adsToRequest
                    resolve:(ABI43_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  FBNativeAdsManager *adsManager = [[FBNativeAdsManager alloc] initWithPlacementID:placementId
                                                                forNumAdsRequested:[adsToRequest intValue]];

  ABI43_0_0EXAdManagerDelegate *delegate = [[ABI43_0_0EXAdManagerDelegate alloc] initWithPlacementId:placementId andManager:self];
  _adsManagersDelegates[placementId] = delegate;
  [adsManager setDelegate:delegate];

  [ABI43_0_0EXUtilities performSynchronouslyOnMainThread:^{
    [adsManager loadAds];
  }];

  [_adsManagers setValue:adsManager forKey:placementId];
  resolve(nil);
}

ABI43_0_0EX_EXPORT_METHOD_AS(setMediaCachePolicy,
                    setMediaCachePolicy:(NSString *)placementId
                    cachePolicy:(NSString *)cachePolicy
                    resolve:(ABI43_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  FBNativeAdsCachePolicy policy = [@{
                                     @"none": @(FBNativeAdsCachePolicyNone),
                                     @"all": @(FBNativeAdsCachePolicyAll),
                                     }[cachePolicy] integerValue] ?: FBNativeAdsCachePolicyNone;
  [_adsManagers[placementId] setMediaCachePolicy:policy];
  resolve(nil);
}

ABI43_0_0EX_EXPORT_METHOD_AS(disableAutoRefresh,
                    disableAutoRefresh:(NSString*)placementId
                    resolve:(ABI43_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI43_0_0EXPromiseRejectBlock)reject)
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

  [[_moduleRegistry getModuleImplementingProtocol:@protocol(ABI43_0_0EXEventEmitterService)] sendEventWithName:@"CTKNativeAdsManagersChanged" body:adsManagersState];
}

- (void)nativeAdForPlacementId:(NSString *)placementId failedToLoadWithError:(NSError *)error
{
  [[_moduleRegistry getModuleImplementingProtocol:@protocol(ABI43_0_0EXEventEmitterService)] sendEventWithName:@"CTKNativeAdManagerErrored" body:@{
    @"placementId": placementId,
    @"error": @{
        @"message": error.localizedDescription ?: error.description,
        @"code": @(error.code)
    },
  }];
}

- (UIView *)view
{
  return [[ABI43_0_0EXNativeAdView alloc] initWithModuleRegistry:_moduleRegistry];
}

ABI43_0_0EX_VIEW_PROPERTY(adsManager, NSString *, ABI43_0_0EXNativeAdView)
{
  [view setNativeAd:[_adsManagers[value] nextNativeAd]];
}

- (void)startObserving {
}

- (void)stopObserving {
}

@end

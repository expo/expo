
#import "EXFacebook.h"
#import "EXNativeAdManager.h"
#import "EXNativeAdView.h"
#import "EXNativeAdEmitter.h"
#import "EXUtil.h"

#import <FBAudienceNetwork/FBAudienceNetwork.h>
#import <React/RCTUtils.h>
#import <React/RCTAssert.h>
#import <React/RCTBridge.h>
#import <React/RCTConvert.h>
#import <React/RCTUIManager.h>
#import <React/RCTBridgeModule.h>

@implementation RCTConvert (EXNativeAdView)

RCT_ENUM_CONVERTER(FBNativeAdsCachePolicy, (@{
  @"none": @(FBNativeAdsCachePolicyNone),
  @"all": @(FBNativeAdsCachePolicyAll),
}), FBNativeAdsCachePolicyNone, integerValue)

@end

@interface EXNativeAdManager () <FBNativeAdsManagerDelegate>

@property (nonatomic, strong) NSMutableDictionary<NSString*, FBNativeAdsManager*> *adsManagers;

@end

@implementation EXNativeAdManager

RCT_EXPORT_MODULE(CTKNativeAdManager)

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

RCT_EXPORT_METHOD(registerViewsForInteraction:(nonnull NSNumber *)nativeAdViewTag
                            mediaViewTag:(nonnull NSNumber *)mediaViewTag
                            adIconViewTag:(nonnull NSNumber *)adIconViewTag
                            clickableViewsTags:(nonnull NSArray *)tags
                            resolve:(RCTPromiseResolveBlock)resolve
                            reject:(RCTPromiseRejectBlock)reject)
{
  [_bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
    FBMediaView *mediaView = nil;
    FBAdIconView *adIconView = nil;
    EXNativeAdView *nativeAdView = nil;
    
    if ([viewRegistry objectForKey:mediaViewTag] == nil) {
      reject(@"E_NO_VIEW_FOR_TAG", @"Could not find mediaView", nil);
      return;
    }
    
    if ([viewRegistry objectForKey:nativeAdViewTag] == nil) {
      reject(@"E_NO_NATIVEAD_VIEW", @"Could not find nativeAdView", nil);
      return;
    }
    
    if ([[viewRegistry objectForKey:mediaViewTag] isKindOfClass:[FBMediaView class]]) {
      mediaView = (FBMediaView *)[viewRegistry objectForKey:mediaViewTag];
    } else {
      reject(@"E_INVALID_VIEW_CLASS", @"View returned for passed media view tag is not an instance of FBMediaView", nil);
      return;
    }
    
    if ([[viewRegistry objectForKey:nativeAdViewTag] isKindOfClass:[EXNativeAdView class]]) {
      nativeAdView = (EXNativeAdView *)[viewRegistry objectForKey:nativeAdViewTag];
    } else {
      reject(@"E_INVALID_VIEW_CLASS", @"View returned for passed native ad view tag is not an instance of EXNativeAdView", nil);
      return;
    }
    
    if ([viewRegistry objectForKey:adIconViewTag]) {
      if ([[viewRegistry objectForKey:adIconViewTag] isKindOfClass:[FBAdIconView class]]) {
        adIconView  = (FBAdIconView *)[viewRegistry objectForKey:adIconViewTag];
      } else {
        reject(@"E_INVALID_VIEW_CLASS", @"View returned for passed ad icon view tag is not an instance of FBAdIconView", nil);
        return;
      }
    }
    
    NSMutableArray<UIView *> *clickableViews = [NSMutableArray new];
    for (id tag in tags) {
      if ([viewRegistry objectForKey:tag]) {
        [clickableViews addObject:[viewRegistry objectForKey:tag]];
      } else {
        reject(@"E_INVALID_VIEW_TAG", [NSString stringWithFormat:@"Could not find view for tag:  %@", [tag stringValue]], nil);
        return;
      }
    }
    
    [nativeAdView registerViewsForInteraction:mediaView adIcon:adIconView clickableViews:clickableViews];
    resolve(@[]);
  }];
}

RCT_EXPORT_METHOD(init:(NSString *)placementId withAdsToRequest:(nonnull NSNumber *)adsToRequest)
{
  if (![EXFacebook facebookAppIdFromNSBundle]) {
    RCTLogWarn(@"No Facebook app id is specified. Facebook ads may have undefined behavior.");
  }
  FBNativeAdsManager *adsManager = [[FBNativeAdsManager alloc] initWithPlacementID:placementId
                                                                forNumAdsRequested:[adsToRequest intValue]];

  [adsManager setDelegate:self];

  [EXUtil performSynchronouslyOnMainThread:^{
    [adsManager loadAds];
  }];

  [_adsManagers setValue:adsManager forKey:placementId];
}

RCT_EXPORT_METHOD(setMediaCachePolicy:(NSString*)placementId cachePolicy:(FBNativeAdsCachePolicy)cachePolicy)
{
  [_adsManagers[placementId] setMediaCachePolicy:cachePolicy];
}

RCT_EXPORT_METHOD(disableAutoRefresh:(NSString*)placementId)
{
  [_adsManagers[placementId] disableAutoRefresh];
}

- (void)nativeAdsLoaded
{
  NSMutableDictionary<NSString*, NSNumber*> *adsManagersState = [NSMutableDictionary new];

  [_adsManagers enumerateKeysAndObjectsUsingBlock:^(NSString* key, FBNativeAdsManager* adManager, __unused BOOL* stop) {
    [adsManagersState setValue:@([adManager isValid]) forKey:key];
  }];
  
  EXNativeAdEmitter *nativeAdEmitter = [_bridge moduleForClass:[EXNativeAdEmitter class]];
  [nativeAdEmitter sendManagersState:adsManagersState];
}

- (void)nativeAdsFailedToLoadWithError:(NSError *)errors
{
  // @todo handle errors here
}

- (UIView *)view
{
  return [[EXNativeAdView alloc] initWithBridge:_bridge];
}

RCT_EXPORT_VIEW_PROPERTY(onAdLoaded, RCTBubblingEventBlock)
RCT_CUSTOM_VIEW_PROPERTY(adsManager, NSString, EXNativeAdView)
{
  view.nativeAd = [_adsManagers[json] nextNativeAd];
}

@end

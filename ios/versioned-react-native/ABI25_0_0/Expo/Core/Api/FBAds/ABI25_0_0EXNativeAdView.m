#import "ABI25_0_0EXNativeAdView.h"

#import <FBAudienceNetwork/FBAudienceNetwork.h>
#import <ReactABI25_0_0/ABI25_0_0RCTUtils.h>

@interface ABI25_0_0EXNativeAdView ()

@property (nonatomic, strong) FBMediaView * mediaView;

@end

@protocol EXFBNativeAdDataModel

@property (nonatomic, readonly) FBAdImage *icon;
@property (nonatomic, readonly) FBAdImage *image;
@property (nonatomic, readonly) NSString *title;

@end

@interface FBNativeAd ( EXFBNativeAd )

@property (nonatomic, readonly) id<EXFBNativeAdDataModel> dataModel;

@end

@implementation ABI25_0_0EXNativeAdView

- (instancetype)init
{
  if ((self = [super init])) {
    _mediaView = [[FBMediaView alloc] initWithFrame:CGRectZero];
    [self addSubview:_mediaView];
  }
  return self;
}

- (void)setNativeAd:(FBNativeAd *)nativeAd
{
  if (_nativeAd != nil) {
    [_nativeAd unregisterView];
  }
  _nativeAd = nativeAd;
  
  _onAdLoaded(@{
                @"title": _nativeAd.dataModel.title,
                @"subtitle": _nativeAd.headline,
                @"description": _nativeAd.bodyText,
                @"socialContext": _nativeAd.socialContext,
                @"callToActionText": _nativeAd.callToAction,
                @"coverImage": _nativeAd.dataModel.image ? [_nativeAd.dataModel.image.url absoluteString] : [NSNull null],
                @"icon": _nativeAd.dataModel.icon ? [_nativeAd.dataModel.icon.url absoluteString] : [NSNull null],
                });
  
  [_nativeAd registerViewForInteraction:self mediaView:_mediaView iconView:nil viewController:ABI25_0_0RCTPresentedViewController() clickableViews:@[self]];
}

@end

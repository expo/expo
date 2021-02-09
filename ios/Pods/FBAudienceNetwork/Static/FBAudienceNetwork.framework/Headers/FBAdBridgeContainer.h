// Copyright 2004-present Facebook. All Rights Reserved.
//
// You are hereby granted a non-exclusive, worldwide, royalty-free license to use,
// copy, modify, and distribute this software in source code or binary form for use
// in connection with the web services and APIs provided by Facebook.
//
// As with any software that integrates with the Facebook platform, your use of
// this software is subject to the Facebook Developer Principles and Policies
// [http://developers.facebook.com/policy/]. This copyright notice shall be
// included in all copies or substantial portions of the software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

/***
 * This is a bridge file for Audience Network Unity SDK.
 *
 * This file may be used to build your own Audience Network iOS SDK wrapper,
 * but note that we don't support customisations of the Audience Network codebase.
 *
 ***/

#import <Foundation/Foundation.h>

#import <FBAudienceNetwork/FBAdBridgeCommon.h>
#import <FBAudienceNetwork/FBAdView.h>
#import <FBAudienceNetwork/FBInterstitialAd.h>
#import <FBAudienceNetwork/FBRewardedVideoAd.h>

typedef void (*FBAdBridgeCallback)(uint32_t uniqueId);
typedef void (*FBAdBridgeErrorCallback)(uint32_t uniqueId, char const *error);

@interface FBAdBridgeContainer : NSObject

@property (nonatomic, assign) int32_t uniqueId;

// Explicitly remove callbacks
- (void)dispose;

@end

@interface FBAdViewBridgeContainer : FBAdBridgeContainer <FBAdViewDelegate>

@property (nonatomic, strong) FBAdView *adView;

@property (nonatomic, assign) FBAdBridgeCallback adViewDidClickCallback;
@property (nonatomic, assign) FBAdBridgeCallback adViewDidFinishHandlingClickCallback;
@property (nonatomic, assign) FBAdBridgeCallback adViewDidLoadCallback;
@property (nonatomic, assign) FBAdBridgeErrorCallback adViewDidFailWithErrorCallback;
@property (nonatomic, assign) FBAdBridgeCallback adViewWillLogImpressionCallback;

- (instancetype)init NS_UNAVAILABLE;
+ (instancetype)new NS_UNAVAILABLE;

- (instancetype)initWithAdView:(FBAdView *)adView withUniqueId:(int32_t)uniqueId NS_DESIGNATED_INITIALIZER;

@end

@interface FBInterstitialAdBridgeContainer : FBAdBridgeContainer <FBInterstitialAdDelegate>

@property (nonatomic, strong) FBInterstitialAd *interstitialAd;

@property (nonatomic, assign) FBAdBridgeCallback interstitialAdDidClickCallback;
@property (nonatomic, assign) FBAdBridgeCallback interstitialAdDidCloseCallback;
@property (nonatomic, assign) FBAdBridgeCallback interstitialAdWillCloseCallback;
@property (nonatomic, assign) FBAdBridgeCallback interstitialAdDidLoadCallback;
@property (nonatomic, assign) FBAdBridgeErrorCallback interstitialAdDidFailWithErrorCallback;
@property (nonatomic, assign) FBAdBridgeCallback interstitialAdWillLogImpressionCallback;

- (instancetype)init NS_UNAVAILABLE;
+ (instancetype)new NS_UNAVAILABLE;

- (instancetype)initWithInterstitialAd:(FBInterstitialAd *)interstitialAd
                          withUniqueId:(int32_t)uniqueId NS_DESIGNATED_INITIALIZER;

@end

@interface FBRewardedVideoAdBridgeContainer : FBAdBridgeContainer <FBRewardedVideoAdDelegate>

@property (nonatomic, strong) FBRewardedVideoAd *rewardedVideoAd;

@property (nonatomic, assign) FBAdBridgeCallback rewardedVideoAdDidClickCallback;
@property (nonatomic, assign) FBAdBridgeCallback rewardedVideoAdDidCloseCallback;
@property (nonatomic, assign) FBAdBridgeCallback rewardedVideoAdWillCloseCallback;
@property (nonatomic, assign) FBAdBridgeCallback rewardedVideoAdDidLoadCallback;
@property (nonatomic, assign) FBAdBridgeErrorCallback rewardedVideoAdDidFailWithErrorCallback;
@property (nonatomic, assign) FBAdBridgeCallback rewardedVideoAdWillLogImpressionCallback;

@property (nonatomic, assign) FBAdBridgeCallback rewardedVideoAdVideoCompleteCallback;
@property (nonatomic, assign) FBAdBridgeCallback rewardedVideoAdServerRewardDidSucceedCallback;
@property (nonatomic, assign) FBAdBridgeCallback rewardedVideoAdServerRewardDidFailCallback;

- (instancetype)init NS_UNAVAILABLE;
+ (instancetype)new NS_UNAVAILABLE;

- (instancetype)initWithRewardedVideoAd:(FBRewardedVideoAd *)rewardedVideoAd
                           withUniqueId:(int32_t)uniqueId NS_DESIGNATED_INITIALIZER;

@end

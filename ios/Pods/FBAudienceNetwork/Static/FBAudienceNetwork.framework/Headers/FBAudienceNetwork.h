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

#import <UIKit/UIKit.h>

#import <FBAudienceNetwork/FBAdChoicesView.h>
#import <FBAudienceNetwork/FBAdDefines.h>
#import <FBAudienceNetwork/FBAdExtraHint.h>
#import <FBAudienceNetwork/FBAdIconView.h>
#import <FBAudienceNetwork/FBAdOptionsView.h>
#import <FBAudienceNetwork/FBAdSettings.h>
#import <FBAudienceNetwork/FBAdView.h>
#import <FBAudienceNetwork/FBInstreamAdView.h>
#import <FBAudienceNetwork/FBInterstitialAd.h>
#import <FBAudienceNetwork/FBMediaView.h>
#import <FBAudienceNetwork/FBMediaViewVideoRenderer.h>
#import <FBAudienceNetwork/FBNativeAd.h>
#import <FBAudienceNetwork/FBNativeAdCollectionViewAdProvider.h>
#import <FBAudienceNetwork/FBNativeAdCollectionViewCellProvider.h>
#import <FBAudienceNetwork/FBNativeAdScrollView.h>
#import <FBAudienceNetwork/FBNativeAdTableViewAdProvider.h>
#import <FBAudienceNetwork/FBNativeAdTableViewCellProvider.h>
#import <FBAudienceNetwork/FBNativeAdView.h>
#import <FBAudienceNetwork/FBNativeAdsManager.h>
#import <FBAudienceNetwork/FBNativeBannerAd.h>
#import <FBAudienceNetwork/FBNativeBannerAdView.h>
#import <FBAudienceNetwork/FBRewardedVideoAd.h>
#import <FBAudienceNetwork/UIView+FBNativeAdViewTag.h>

// NOTE: Any changes should also be made to the module.modulemap
// to ensure comptability with Swift apps using Cocoapods

#define FB_AD_SDK_VERSION @"5.1.1"

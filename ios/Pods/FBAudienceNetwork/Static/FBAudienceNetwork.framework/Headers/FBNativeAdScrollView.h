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

#import <FBAudienceNetwork/FBAdDefines.h>
#import <FBAudienceNetwork/FBNativeAdView.h>
#import <FBAudienceNetwork/FBNativeAdsManager.h>

NS_ASSUME_NONNULL_BEGIN

@protocol FBNativeAdView;

/**
  Contains multiple ads in a scroll view.


 If adding this view to a XIB or Storyboard, you may recieve the error "Unknown class FBNativeAdScrollView in Interface Builder file" in some cases. This error is caused by the linker failing to include FBNativeAdScrollView in your build. To resolve this, call [FBNativeAdScrollView class] in your project, or add "-all_load -ObjC" to "Other Linker Flags" in your project settings.
 */
FB_CLASS_EXPORT FB_SUBCLASSING_RESTRICTED
@interface FBNativeAdScrollView : UIView

/**
  Maximum native ads that this scroll view will load. Defaults to 10. If changed after calling loadAds, all current ads will be discarded and loadAds must be called again.
 */
@property (nonatomic, assign, readonly) NSUInteger maximumNativeAdCount;

/**
  Toggles animating the loaded views. Default is YES.
 */
@property (nonatomic, assign, getter=isAnimationEnabled) BOOL animationEnabled;

/**
  Horizontal inset for views in the scroll view. Defaults to 8 points.
 */
@property (nonatomic, assign) CGFloat xInset;

/**
  Reloads the same ads for the same manager. Default is NO.
 */
@property (nonatomic, assign, getter=isAdPersistenceEnabled) BOOL adPersistenceEnabled;

/**
  A view controller that is used to present modal content. If nil, the view searches for a view controller.
 */
@property (nonatomic, weak, nullable) UIViewController *rootViewController;

/**
  Passes delegate methods from FBNativeAd. Separate delegate calls will be made for each native ad contained.
 */
@property (nonatomic, weak, nullable) id<FBNativeAdDelegate> delegate;

/**
  Creates a native ad horizontal scroll view for a given native ads manager and native ad template. The manager can be preloaded with ads, and loadAds will use the preloaded ads from the manager. Otherwise, the scroll view uses the manager to load ads normally.
 @param manager An instance of FBNativeAdManager. Can be preloaded with ads.
 @param type The type of this native ad template. For more information, consult FBNativeAdViewType.
 */
- (instancetype)initWithNativeAdsManager:(FBNativeAdsManager *)manager
                                withType:(FBNativeAdViewType)type;


/**
  Creates a native ad horizontal scroll view for a given native ads manager and native ad template. The manager can be preloaded with ads, and loadAds will use the preloaded ads from the manager. Otherwise, the scroll view uses the manager to load ads normally.
 @param manager An instance of FBNativeAdManager. Can be preloaded with ads.
 @param type The type of this native ad template. For more information, consult FBNativeAdViewType.
 @param attributes The layout of this native ad template. For more information, consult FBNativeAdViewLayout.
 */
- (instancetype)initWithNativeAdsManager:(FBNativeAdsManager *)manager
                                withType:(FBNativeAdViewType)type
                          withAttributes:(FBNativeAdViewAttributes *)attributes;

/**
  Creates a native ad horizontal scroll view for a given native ads manager and native ad template. The manager can be preloaded with ads, and loadAds will use the preloaded ads from the manager. Otherwise, the scroll view uses the manager to load ads normally.
 @param manager An instance of FBNativeAdManager. Can be preloaded with ads.
 @param type The type of this native ad template. For more information, consult FBNativeAdViewType.
 @param attributes The layout of this native ad template. For more information, consult FBNativeAdViewLayout.
 @param maximumNativeAdCount Maximum native ads to show at once.
 */
- (instancetype)initWithNativeAdsManager:(FBNativeAdsManager *)manager
                                withType:(FBNativeAdViewType)type
                          withAttributes:(FBNativeAdViewAttributes *)attributes
                             withMaximum:(NSUInteger)maximumNativeAdCount;


/**
  This is a method to create a native ad horizontal scroll view from a user provided view.
 @param manager An instance of FBNativeAdManager. Can be preloaded with ads.
 @param childViewProvider Block that creates new views for each loaded native ad. Must not reuse the same instance, but return a new view for each call. Views may be arbitrarily resized and should support resizing their content through Auto Layout constraints, autoresizing masks, or manual resizing.
 */
- (instancetype)initWithNativeAdsManager:(FBNativeAdsManager *)manager
                        withViewProvider:(UIView *(^)( FBNativeAd *nativeAd, NSUInteger position))childViewProvider;

/**
  This is a method to create a native ad horizontal scroll view from a user provided view.
 @param manager An instance of FBNativeAdManager. Can be preloaded with ads.
 @param childViewProvider Block that creates new views for each loaded native ad. Must not reuse the same instance, but return a new view for each call. Views may be arbitrarily resized and should support resizing their content through Auto Layout constraints, autoresizing masks, or manual resizing.
 @param maximumNativeAdCount Maximum native ads to show at once.
 */
- (instancetype)initWithNativeAdsManager:(FBNativeAdsManager *)manager
                        withViewProvider:(UIView *(^)(FBNativeAd *nativeAd, NSUInteger position))childViewProvider
                             withMaximum:(NSUInteger)maximumNativeAdCount NS_DESIGNATED_INITIALIZER;

@end

NS_ASSUME_NONNULL_END

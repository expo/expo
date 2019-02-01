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
#import <FBAudienceNetwork/FBAdExtraHint.h>

NS_ASSUME_NONNULL_BEGIN

@protocol FBInstreamAdViewDelegate;

/**
 A customized UIView to display an instream video ad by Facebook.
 */
FB_CLASS_EXPORT FB_SUBCLASSING_RESTRICTED
@interface FBInstreamAdView : UIView

/**
 Returns YES if the instream ad has been successfully loaded.

 Note that the `adView:didFailWithError:` delegate method will be also be called
 instead of `adViewDidLoad:` if the ad fails to load for any reason.
 */
@property (nonatomic, getter=isAdValid, readonly) BOOL adValid;

/**
 This property must be set prior to calling `loadAd`, so that delegate method calls
 are received and handled.
 */
@property (nonatomic, weak, nullable) id<FBInstreamAdViewDelegate> delegate;

/**
 Typed access to the id of the ad placement.
 */
@property (nonatomic, copy, readonly) NSString *placementID;

/**
 FBAdExtraHint to provide extra info
 */
@property (nonatomic, strong, nullable) FBAdExtraHint *extraHint;

/**
 Initializes and returns a newly allocated FBInstreamAdView object with the
 given placement id.

 @param placementID The id of the ad placement. You can create your placement id from Facebook developers page.
 */
- (nullable instancetype)initWithPlacementID:(NSString *)placementID NS_DESIGNATED_INITIALIZER;

/**
 Begins loading ad content.

 You should implement `adViewDidLoad:` and `adView:didFailWithError:` methods
 of `FBInstreamAdViewDelegate` to be notified when loading succeeds or fails.
 */
- (void)loadAd;

/**
 Begins loading ad content from a bid payload attained through a server side bid.


 You can implement `adViewDidLoad:` and `adView:didFailWithError:` methods
 of `FBInstreamAdViewDelegate` to be notified when loading succeeds or fails.

 @param bidPayload The payload of the ad bid. You can get your bid id from Facebook bidder endpoint.
 */
- (void)loadAdWithBidPayload:(NSString *)bidPayload;

/**
 Begins ad playback.  This method should only be called after an `adViewDidLoad:` call
 has been received.

 @param rootViewController The view controller that will be used to modally
   present additional view controllers, to render the ad's landing page for example.
 */
- (BOOL)showAdFromRootViewController:(nullable UIViewController *)rootViewController;

@end

/**
 The FBInstreamAdViewDelegate protocol defines methods that allow the owner of an
 FBInstreamAdView to respond to various stages of ad operation.
 */
@protocol FBInstreamAdViewDelegate <NSObject>

/**
 Sent when an FBInstreamAdView instance successfully loads an ad.

 @param adView The FBInstreamAdView object sending the message.
 */
- (void)adViewDidLoad:(FBInstreamAdView *)adView;

/**
 Sent when ad playback has completed and the FBInstreamAdView is ready to be
 deallocated. This method is mutually exclusive to `adView:didFailWithError:`, and
 it is impossible for both methods to be received for a single ad session.

 @param adView The FBInstreamAdView object sending the message.
 */
- (void)adViewDidEnd:(FBInstreamAdView *)adView;

/**
 Sent when ad playback has failed to load or play an ad, and the FBInstreamAdView
 is ready to be deallocated. It is possible for this method to be called after
 `loadAd` (if they ad fails to load) or after `showAdFromRootViewController:`
 (if the ad has a playback failure).

 @param adView The FBInstreamAdView object sending the message.
 @param error An NSError object containing details of the error.
 */
- (void)adView:(FBInstreamAdView *)adView didFailWithError:(NSError *)error;

@optional

/**
 Sent when the user has touched the click-through interface element. The ad's
 landing page will be shown.

 @param adView The FBInstreamAdView object sending the message.
 */
- (void)adViewDidClick:(FBInstreamAdView *)adView;

/**
 Sent immediately before the impression of an FBInstreamAdView object will be logged.

 @param adView The FBInstreamAdView object sending the message.
 */
- (void)adViewWillLogImpression:(FBInstreamAdView *)adView;

@end

NS_ASSUME_NONNULL_END

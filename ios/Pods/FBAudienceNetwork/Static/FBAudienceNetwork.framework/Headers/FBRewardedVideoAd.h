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

#import <CoreMedia/CoreMedia.h>
#import <Foundation/Foundation.h>

#import <FBAudienceNetwork/FBAdDefines.h>
#import <FBAudienceNetwork/FBAdExtraHint.h>

NS_ASSUME_NONNULL_BEGIN

@protocol FBRewardedVideoAdDelegate;

/**
  A modal view controller to represent a Facebook rewarded video ad. This
 is a full-screen ad shown in your application.
 */
FB_CLASS_EXPORT FB_SUBCLASSING_RESTRICTED
@interface FBRewardedVideoAd : NSObject

/**
  Typed access to the id of the ad placement.
 */
@property (nonatomic, copy, readonly) NSString *placementID;

/**
  The duration of the video, as a CMTime value.  Returns kCMTimeIndefinite if no video is loaded.
 */
@property (nonatomic, assign, readonly) CMTime duration;

/**
  the delegate
 */
@property (nonatomic, weak, nullable) id<FBRewardedVideoAdDelegate> delegate;

/**
  Returns true if the rewarded video ad has been successfully loaded.
 You should check `isAdValid` before trying to show the ad.
 */
@property (nonatomic, getter=isAdValid, readonly) BOOL adValid;

/**
 FBAdExtraHint to provide extra info
 */
@property (nonatomic, strong, nullable) FBAdExtraHint *extraHint;

/**
  This is a method to initialize an FBRewardedVideoAd matching the given placement id.

 @param placementID The id of the ad placement. You can create your placement id from Facebook developers page.
 */
- (instancetype)initWithPlacementID:(NSString *)placementID;

/**
  This is a method to initialize an FBRewardedVideoAd matching the given placement id and allows the publisher to set
 the reward to give to a user.

 - Parameter placementID The id of the ad placement. You can create your placement id from Facebook developers page.
 - Parameter userID the id of the user
 - Parameter currency reward currency type
 */
- (instancetype)initWithPlacementID:(NSString *)placementID
                         withUserID:(nullable NSString *)userID
                       withCurrency:(nullable NSString *)currency;

/**
  Begins loading the FBRewardedVideoAd content.


 You can implement `rewardedVideoAdDidLoad:` and `rewardedVideoAd:didFailWithError:` methods
 of `FBRewardedVideoAdDelegate` if you would like to be notified as loading succeeds or fails.
 */
- (void)loadAd;

/**
 Begins loading the FBRewardedVideoAd content from a bid payload attained through a server side bid.


 You can implement `rewardedVideoAdDidLoad:` and `rewardedVideoAd:didFailWithError:` methods
 of `FBRewardedVideoAdDelegate` if you would like to be notified as loading succeeds or fails.
 */
- (void)loadAdWithBidPayload:(NSString *)bidPayload;

/**
 This method allows the publisher to set the reward to give to a user. Returns NO if it was not able
 to set Reward Data.

 - Parameter userID the id of the user
 - Parameter currency reward currency type
 */

- (BOOL)setRewardDataWithUserID:(NSString *)userID
                   withCurrency:(NSString *)currency;

/**
  Presents the rewarded video ad modally from the specified view controller.

 @param rootViewController The view controller that will be used to present the rewarded video ad.


 You can implement `rewardedVideoAdDidClick:` and `rewardedVideoAdWillClose:`
 methods of `FBRewardedVideoAdDelegate` if you would like to stay informed for those events.
 */
- (BOOL)showAdFromRootViewController:(UIViewController *)rootViewController;

/**
  Presents the rewarded video ad modally from the specified view controller.

 @param rootViewController The view controller that will be used to present the rewarded video ad.
 @param flag Pass YES to animate the presentation; otherwise, pass NO.


 You can implement `rewardedVideoAdDidClick:` and `rewardedVideoAdWillClose:`
 methods of `FBRewardedVideoAdDelegate` if you would like to stay informed for those events.
 */
- (BOOL)showAdFromRootViewController:(UIViewController *)rootViewController animated:(BOOL)flag;

@end

/**
  The methods declared by the FBRewardedVideoAdDelegate protocol allow the adopting delegate to respond
 to messages from the FBRewardedVideoAd class and thus respond to operations such as whether the ad has
 been loaded, the person has clicked the ad or closed video/end card.
 */
@protocol FBRewardedVideoAdDelegate <NSObject>

@optional

/**
  Sent after an ad has been clicked by the person.

 @param rewardedVideoAd An FBRewardedVideoAd object sending the message.
 */
- (void)rewardedVideoAdDidClick:(FBRewardedVideoAd *)rewardedVideoAd;

/**
  Sent when an ad has been successfully loaded.

 @param rewardedVideoAd An FBRewardedVideoAd object sending the message.
 */
- (void)rewardedVideoAdDidLoad:(FBRewardedVideoAd *)rewardedVideoAd;

/**
  Sent after an FBRewardedVideoAd object has been dismissed from the screen, returning control
 to your application.

 @param rewardedVideoAd An FBRewardedVideoAd object sending the message.
 */
- (void)rewardedVideoAdDidClose:(FBRewardedVideoAd *)rewardedVideoAd;

/**
  Sent immediately before an FBRewardedVideoAd object will be dismissed from the screen.

 @param rewardedVideoAd An FBRewardedVideoAd object sending the message.
 */
- (void)rewardedVideoAdWillClose:(FBRewardedVideoAd *)rewardedVideoAd;

/**
  Sent after an FBRewardedVideoAd fails to load the ad.

 @param rewardedVideoAd An FBRewardedVideoAd object sending the message.
 @param error An error object containing details of the error.
 */
- (void)rewardedVideoAd:(FBRewardedVideoAd *)rewardedVideoAd didFailWithError:(NSError *)error;

/**
  Sent after the FBRewardedVideoAd object has finished playing the video successfully.
 Reward the user on this callback.

 @param rewardedVideoAd An FBRewardedVideoAd object sending the message.
 */
- (void)rewardedVideoAdVideoComplete:(FBRewardedVideoAd *)rewardedVideoAd;

/**
  Sent immediately before the impression of an FBRewardedVideoAd object will be logged.

 @param rewardedVideoAd An FBRewardedVideoAd object sending the message.
 */
- (void)rewardedVideoAdWillLogImpression:(FBRewardedVideoAd *)rewardedVideoAd;

/**
  Sent if server call to publisher's reward endpoint returned HTTP status code 200.

 @param rewardedVideoAd An FBRewardedVideoAd object sending the message.
 */
- (void)rewardedVideoAdServerRewardDidSucceed:(FBRewardedVideoAd *)rewardedVideoAd;

/**
  Sent if server call to publisher's reward endpoint did not return HTTP status code 200
 or if the endpoint timed out.

 @param rewardedVideoAd An FBRewardedVideoAd object sending the message.
 */
- (void)rewardedVideoAdServerRewardDidFail:(FBRewardedVideoAd *)rewardedVideoAd;

@end


NS_ASSUME_NONNULL_END

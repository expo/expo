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

#import <Foundation/Foundation.h>

#import <FBAudienceNetwork/FBAdDefines.h>

NS_ASSUME_NONNULL_BEGIN

/**
 FBAdInitSettings is an object to incapsulate all the settings you can pass to SDK on initialization call.
 */
FB_CLASS_EXPORT FB_SUBCLASSING_RESTRICTED
@interface FBAdInitSettings : NSObject

/**
 Designated initializer for FBAdInitSettings
 If an ad provided service is mediating Audience Network in their sdk, it is required to set the name of the mediation service

 @param placementIDs An array of placement identifiers.
 @param mediationService String to identify mediation provider.
 */
- (instancetype)initWithPlacementIDs:(NSArray<NSString *> *)placementIDs mediationService:(NSString *)mediationService;

/**
 An array of placement identifiers.
 */
@property (nonatomic, copy, readonly) NSArray<NSString *> *placementIDs;

/**
 String to identify mediation provider.
 */
@property (nonatomic, copy, readonly) NSString *mediationService;

@end

/**
 FBAdInitResults is an object to incapsulate all the results you'll get as a result of SDK initialization call.
 */
FB_CLASS_EXPORT FB_SUBCLASSING_RESTRICTED
@interface FBAdInitResults : NSObject

/**
 Boolean which says whether initialization was successful
 */
@property (nonatomic, assign, readonly, getter = isSuccess) BOOL success;

/**
 Message which provides more details about initialization result
 */
@property (nonatomic, copy, readonly) NSString *message;

@end

/**
  FBAudienceNetworkAds is an entry point to AN SDK.
 */
typedef NS_ENUM(NSInteger, FBAdFormatTypeName) {
    FBAdFormatTypeNameUnknown = 0,
    FBAdFormatTypeNameBanner,
    FBAdFormatTypeNameInterstitial,
    FBAdFormatTypeNameInstream,
    FBAdFormatTypeNameNative,
    FBAdFormatTypeNameNativeBanner,
    FBAdFormatTypeNameRewardedVideo,
};

FB_CLASS_EXPORT FB_SUBCLASSING_RESTRICTED
@interface FBAudienceNetworkAds : NSObject

/**
 Initialize Audience Network SDK at any given point of time. It will be called automatically with default settigs when you first touch AN related code otherwise.

 @param settings The settings to initialize with
 @param completionHandler The block which will be called when initialization finished
 */
+ (void)initializeWithSettings:(nullable FBAdInitSettings *)settings completionHandler:(nullable void (^)(FBAdInitResults *results))completionHandler;

/**
 Returns ad format type name for a given placement id.

 @param placementId Placement id that is configured for the current app.
 */
+ (FBAdFormatTypeName)adFormatTypeNameForPlacementId:(NSString *)placementId;

@end

NS_ASSUME_NONNULL_END

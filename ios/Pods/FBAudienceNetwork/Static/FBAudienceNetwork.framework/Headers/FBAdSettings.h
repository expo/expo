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
 Audience Network error domain
 */
FB_EXPORT NSString * const FBAudienceNetworkErrorDomain;
/**
 Audience Network error FBMediaView error domain
 */
FB_EXPORT NSString * const FBAudienceNetworkMediaViewErrorDomain;

/**
 Audience Network SDK logging levels
 */
typedef NS_ENUM(NSInteger, FBAdLogLevel) {
    /// No logging
    FBAdLogLevelNone,
    /// Notifications
    FBAdLogLevelNotification,
    /// Errors only
    FBAdLogLevelError,
    /// Warnings only
    FBAdLogLevelWarning,
    /// Standard log level
    FBAdLogLevelLog,
    /// Debug logging
    FBAdLogLevelDebug,
    /// Log everything (verbose)
    FBAdLogLevelVerbose
};

/**
 Determines what method is used for rendering FBMediaView content
 */
typedef NS_ENUM(NSInteger, FBMediaViewRenderingMethod) {
    /// Automatic selection of rendering method
    FBMediaViewRenderingMethodDefault,
    /// Force Metal rendering (only use for devices with support)
    FBMediaViewRenderingMethodMetal,
    /// Force OpenGL rendering
    FBMediaViewRenderingMethodOpenGL,
    /// Software fallback
    FBMediaViewRenderingMethodSoftware
};

/**
 Test Ad type to be injected when test mode is on
 */
typedef NS_ENUM(NSInteger, FBAdTestAdType) {
    /// This will return a random ad type when test mode is on.
    FBAdTestAdType_Default,
    /// 16x9 image ad with app install CTA option
    FBAdTestAdType_Img_16_9_App_Install,
    /// 16x9 image ad with link CTA option
    FBAdTestAdType_Img_16_9_Link,
    /// 16x9 HD video 46 sec ad with app install CTA option
    FBAdTestAdType_Vid_HD_16_9_46s_App_Install,
    /// 16x9 HD video 46 sec ad with link CTA option
    FBAdTestAdType_Vid_HD_16_9_46s_Link,
    /// 16x9 HD video 15 sec ad with app install CTA option
    FBAdTestAdType_Vid_HD_16_9_15s_App_Install,
    /// 16x9 HD video 15 sec ad with link CTA option
    FBAdTestAdType_Vid_HD_16_9_15s_Link,
    /// 9x16 HD video 39 sec ad with app install CTA option
    FBAdTestAdType_Vid_HD_9_16_39s_App_Install,
    /// 9x16 HD video 39 sec ad with link CTA option
    FBAdTestAdType_Vid_HD_9_16_39s_Link,
    /// carousel ad with square image and app install CTA option
    FBAdTestAdType_Carousel_Img_Square_App_Install,
    /// carousel ad with square image and link CTA option
    FBAdTestAdType_Carousel_Img_Square_Link
};

@protocol FBAdLoggingDelegate;

/**
  AdSettings contains global settings for all ad controls.
 */
FB_CLASS_EXPORT FB_SUBCLASSING_RESTRICTED
@interface FBAdSettings : NSObject

/**
 Controls support for audio-only video playback when the app is backgrounded.  Note that this is only supported
 when using FBMediaViewVideoRenderer, and requires corresponding support for background audio to be added to
 the app.  Default value is NO.
 */
@property (class, nonatomic, assign, getter=isBackgroundVideoPlaybackAllowed) BOOL backgroundVideoPlaybackAllowed;

/**
 When test mode is on, setting a non default value for testAdType will
 requests the specified type of ad.
 */
@property (class, nonatomic, assign) FBAdTestAdType testAdType;

/**
 When this delegate is set, logs will be redirected to the delegate instead of being logged directly to the console with NSLog.
 This can be used in combination with external logging frameworks.
 */
@property (class, nonatomic, weak, nullable) id<FBAdLoggingDelegate> loggingDelegate;

/**
 Generates bidder token that needs to be included in the server side bid request to Facebook endpoint.
 */
@property (class, nonatomic, copy, readonly) NSString *bidderToken;

/**
 Generates routing token needed for requests routing in reverse-proxy, since we don't have cookies in app environments.
 */
@property (class, nonatomic, copy, readonly) NSString *routingToken;

/**
 Returns test mode on/off.
 */
+ (BOOL)isTestMode;

/**
  Returns the hashid of the device to use test mode on.
 */
+ (NSString *)testDeviceHash;

/**
  Adds a test device.

 @param deviceHash The id of the device to use test mode, can be obtained from debug log or testDeviceHash



 Copy the current device Id from debug log and add it as a test device to get test ads. Apps
 running on emulator will automatically get test ads. Test devices should be added before loadAd is called.
 */
+ (void)addTestDevice:(NSString *)deviceHash;

/**
  Add a collection of test devices. See `+addTestDevices:` for details.

 @param devicesHash The array of the device id to use test mode, can be obtained from debug log or testDeviceHash
 */
+ (void)addTestDevices:(FB_NSArrayOf(NSString *)*)devicesHash;

/**
  Clear all the added test devices
 */
+ (void)clearTestDevices;

/**
  Clears the added test device

 @param deviceHash The id of the device using test mode, can be obtained from debug log or testDeviceHash
 */
+ (void)clearTestDevice:(NSString *)deviceHash;

/**
  Configures the ad control for treatment as child-directed.

 @param isChildDirected Indicates whether you would like your ad control to be treated as child-directed

 Note that you may have other legal obligations under the Children's Online Privacy Protection Act (COPPA).
 Please review the FTC's guidance and consult with your own legal counsel.
 */
+ (void)setIsChildDirected:(BOOL)isChildDirected;

/**
  If an ad provided service is mediating Audience Network in their sdk, it is required to set the name of the mediation service

 @param service Representing the name of the mediation that is mediation Audience Network
 */
+ (void)setMediationService:(NSString *)service;

/**
  Gets the url prefix to use when making ad requests.

 This method should never be used in production.
 */
+ (nullable NSString *)urlPrefix;

/**
  Sets the url prefix to use when making ad requests.



 This method should never be used in production.
 */
+ (void)setUrlPrefix:(nullable NSString *) urlPrefix;

/**
  Gets the current SDK logging level
 */
+ (FBAdLogLevel)getLogLevel;

/**
  Sets the current SDK logging level
 */
+ (void)setLogLevel:(FBAdLogLevel)level;

/**
  Gets the FBMediaView rendering method
 */
+ (FBMediaViewRenderingMethod)mediaViewRenderingMethod;

/**
  Sets the FBMediaView rendering method
  - Parameter mediaViewRenderingMethod:
    FBMediaViewRenderingMethodDefault: SDK chooses optimized rendering method
    FBMediaViewRenderingMethodMetal: use Metal kit rendering method
    FBMediaViewRenderingMethodOpenGL: use OpenGL rendering method
    FBMediaViewRenderingMethodSoftware: use software rendering method
 */
+ (void)setMediaViewRenderingMethod:(FBMediaViewRenderingMethod)mediaViewRenderingMethod;

@end

@protocol FBAdLoggingDelegate <NSObject>

- (void)logAtLevel:(FBAdLogLevel)level
      withFileName:(NSString *)fileName
    withLineNumber:(int)lineNumber
      withThreadId:(long)threadId
          withBody:(NSString *)body;

@end

NS_ASSUME_NONNULL_END

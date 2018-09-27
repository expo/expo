// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
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

#import "FBSDKMacros.h"
#import "FBSDKProfilePictureView.h"

/**
  Notification indicating that the `currentProfile` has changed.

 the userInfo dictionary of the notification will contain keys
 `FBSDKProfileChangeOldKey` and
 `FBSDKProfileChangeNewKey`.
 */
FBSDK_EXTERN NSString *const FBSDKProfileDidChangeNotification;

/*   key in notification's userInfo object for getting the old profile.

 If there was no old profile, the key will not be present.
 */
FBSDK_EXTERN NSString *const FBSDKProfileChangeOldKey;

/*   key in notification's userInfo object for getting the new profile.

 If there is no new profile, the key will not be present.
 */
FBSDK_EXTERN NSString *const FBSDKProfileChangeNewKey;

/**
  Represents an immutable Facebook profile

 This class provides a global "currentProfile" instance to more easily
 add social context to your application. When the profile changes, a notification is
 posted so that you can update relevant parts of your UI and is persisted to NSUserDefaults.

 Typically, you will want to call `enableUpdatesOnAccessTokenChange:YES` so that
 it automatically observes changes to the `[FBSDKAccessToken currentAccessToken]`.

 You can use this class to build your own `FBSDKProfilePictureView` or in place of typical requests to "/me".
 */
@interface FBSDKProfile : NSObject<NSCopying, NSSecureCoding>

/**
  initializes a new instance.
 @param userID the user ID
 @param firstName the user's first name
 @param middleName the user's middle name
 @param lastName the user's last name
 @param name the user's complete name
 @param linkURL the link for this profile
 @param refreshDate the optional date this profile was fetched. Defaults to [NSDate date].
 */
- (instancetype)initWithUserID:(NSString *)userID
                     firstName:(NSString *)firstName
                    middleName:(NSString *)middleName
                      lastName:(NSString *)lastName
                          name:(NSString *)name
                       linkURL:(NSURL *)linkURL
                   refreshDate:(NSDate *)refreshDate NS_DESIGNATED_INITIALIZER;
/**
  The user id
 */
@property (nonatomic, copy, readonly) NSString *userID;
/**
  The user's first name
 */
@property (nonatomic, copy, readonly) NSString *firstName;
/**
  The user's middle name
 */
@property (nonatomic, copy, readonly) NSString *middleName;
/**
  The user's last name
 */
@property (nonatomic, copy, readonly) NSString *lastName;
/**
  The user's complete name
 */
@property (nonatomic, copy, readonly) NSString *name;
/**
  A URL to the user's profile.

 Consider using Bolts and `FBSDKAppLinkResolver` to resolve this
 to an app link to link directly to the user's profile in the Facebook app.
 */
@property (nonatomic, readonly) NSURL *linkURL;

/**
  The last time the profile data was fetched.
 */
@property (nonatomic, readonly) NSDate *refreshDate;

/**
  Gets the current FBSDKProfile instance.
 */
+ (FBSDKProfile *)currentProfile;

/**
  Sets the current instance and posts the appropriate notification if the profile parameter is different
 than the receiver.
 @param profile the profile to set

 This persists the profile to NSUserDefaults.
 */
+ (void)setCurrentProfile:(FBSDKProfile *)profile;

/**
  Indicates if `currentProfile` will automatically observe `FBSDKAccessTokenDidChangeNotification` notifications
 @param enable YES is observing

 If observing, this class will issue a graph request for public profile data when the current token's userID
 differs from the current profile. You can observe `FBSDKProfileDidChangeNotification` for when the profile is updated.

 Note that if `[FBSDKAccessToken currentAccessToken]` is unset, the `currentProfile` instance remains. It's also possible
 for `currentProfile` to return nil until the data is fetched.
 */
+ (void)enableUpdatesOnAccessTokenChange:(BOOL)enable;

/**
  Loads the current profile and passes it to the completion block.
 @param completion The block to be executed once the profile is loaded

 If the profile is already loaded, this method will call the completion block synchronously, otherwise it
 will begin a graph request to update `currentProfile` and then call the completion block when finished.
 */
+ (void)loadCurrentProfileWithCompletion:(void(^)(FBSDKProfile *profile, NSError *error))completion;

/**
  A convenience method for returning a complete `NSURL` for retrieving the user's profile image.
 @param mode The picture mode
 @param size The height and width. This will be rounded to integer precision.
 */
- (NSURL *)imageURLForPictureMode:(FBSDKProfilePictureMode)mode size:(CGSize)size;

/**
  A convenience method for returning a Graph API path for retrieving the user's profile image.

@warning use `imageURLForPictureMode:size:` instead

 You can pass this to a `FBSDKGraphRequest` instance to download the image.
 @param mode The picture mode
 @param size The height and width. This will be rounded to integer precision.
 */
- (NSString *)imagePathForPictureMode:(FBSDKProfilePictureMode)mode size:(CGSize)size
__attribute__ ((deprecated("use imageURLForPictureMode:size: instead")));

/**
  Returns YES if the profile is equivalent to the receiver.
 @param profile the profile to compare to.
 */
- (BOOL)isEqualToProfile:(FBSDKProfile *)profile;
@end

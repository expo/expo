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

#import "TargetConditionals.h"

#if !TARGET_OS_TV

 #import "FBSDKProfile+Internal.h"

 #if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_10_0

NSNotificationName const FBSDKProfileDidChangeNotification = @"com.facebook.sdk.FBSDKProfile.FBSDKProfileDidChangeNotification";;

 #else

NSString *const FBSDKProfileDidChangeNotification = @"com.facebook.sdk.FBSDKProfile.FBSDKProfileDidChangeNotification";;

 #endif

NSString *const FBSDKProfileChangeOldKey = @"FBSDKProfileOld";
NSString *const FBSDKProfileChangeNewKey = @"FBSDKProfileNew";
static NSString *const FBSDKProfileUserDefaultsKey = @"com.facebook.sdk.FBSDKProfile.currentProfile";
static FBSDKProfile *g_currentProfile;

 #define FBSDKPROFILE_USERID_KEY @"userID"
 #define FBSDKPROFILE_FIRSTNAME_KEY @"firstName"
 #define FBSDKPROFILE_MIDDLENAME_KEY @"middleName"
 #define FBSDKPROFILE_LASTNAME_KEY @"lastName"
 #define FBSDKPROFILE_NAME_KEY @"name"
 #define FBSDKPROFILE_LINKURL_KEY @"linkURL"
 #define FBSDKPROFILE_REFRESHDATE_KEY @"refreshDate"
 #define FBSDKPROFILE_IMAGEURL_KEY @"imageURL"
 #define FBSDKPROFILE_EMAIL_KEY @"email"

// Once a day
 #define FBSDKPROFILE_STALE_IN_SECONDS (60 * 60 * 24)

@implementation FBSDKProfile

- (instancetype)initWithUserID:(NSString *)userID
                     firstName:(NSString *)firstName
                    middleName:(NSString *)middleName
                      lastName:(NSString *)lastName
                          name:(NSString *)name
                       linkURL:(NSURL *)linkURL
                   refreshDate:(NSDate *)refreshDate
{
  return [self initWithUserID:userID
                    firstName:firstName
                   middleName:middleName
                     lastName:lastName
                         name:name
                      linkURL:linkURL
                  refreshDate:refreshDate
                     imageURL:nil
                        email:nil];
}

- (instancetype)initWithUserID:(NSString *)userID
                     firstName:(NSString *)firstName
                    middleName:(NSString *)middleName
                      lastName:(NSString *)lastName
                          name:(NSString *)name
                       linkURL:(NSURL *)linkURL
                   refreshDate:(NSDate *)refreshDate
                      imageURL:(NSURL *)imageURL
                         email:(NSString *)email
{
  if ((self = [super init])) {
    _userID = [userID copy];
    _firstName = [firstName copy];
    _middleName = [middleName copy];
    _lastName = [lastName copy];
    _name = [name copy];
    _linkURL = [linkURL copy];
    _refreshDate = [refreshDate copy] ?: [NSDate date];
    _imageURL = [imageURL copy];
    _email = [email copy];
  }
  return self;
}

+ (nullable FBSDKProfile *)currentProfile
{
  return g_currentProfile;
}

+ (void)setCurrentProfile:(nullable FBSDKProfile *)profile
{
  [self setCurrentProfile:profile shouldPostNotification:YES];
}

+ (void)setCurrentProfile:(nullable FBSDKProfile *)profile
   shouldPostNotification:(BOOL)shouldPostNotification
{
  if (profile != g_currentProfile && ![profile isEqualToProfile:g_currentProfile]) {
    [[self class] cacheProfile:profile];
    NSMutableDictionary *userInfo = [NSMutableDictionary dictionary];

    [FBSDKTypeUtility dictionary:userInfo setObject:profile forKey:FBSDKProfileChangeNewKey];
    [FBSDKTypeUtility dictionary:userInfo setObject:g_currentProfile forKey:FBSDKProfileChangeOldKey];
    g_currentProfile = profile;

    if (shouldPostNotification) {
      [[NSNotificationCenter defaultCenter] postNotificationName:FBSDKProfileDidChangeNotification
                                                          object:[self class]
                                                        userInfo:userInfo];
    }
  }
}

- (NSURL *)imageURLForPictureMode:(FBSDKProfilePictureMode)mode size:(CGSize)size
{
  return [FBSDKProfile imageURLForProfileID:_userID PictureMode:mode size:size];
}

+ (void)enableUpdatesOnAccessTokenChange:(BOOL)enable
{
  if (enable) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(observeChangeAccessTokenChange:)
                                                 name:FBSDKAccessTokenDidChangeNotification
                                               object:nil];
  } else {
    [[NSNotificationCenter defaultCenter] removeObserver:self];
  }
}

+ (void)loadCurrentProfileWithCompletion:(FBSDKProfileBlock)completion
{
  [self loadProfileWithToken:[FBSDKAccessToken currentAccessToken] completion:completion];
}

 #pragma mark - NSCopying

- (instancetype)copyWithZone:(NSZone *)zone
{
  // immutable
  return self;
}

 #pragma mark - Equality

- (NSUInteger)hash
{
  NSUInteger subhashes[] = {
    self.userID.hash,
    self.firstName.hash,
    self.middleName.hash,
    self.lastName.hash,
    self.name.hash,
    self.linkURL.hash,
    self.refreshDate.hash,
    self.imageURL.hash,
    self.email.hash,
  };
  return [FBSDKMath hashWithIntegerArray:subhashes count:sizeof(subhashes) / sizeof(subhashes[0])];
}

- (BOOL)isEqual:(id)object
{
  if (self == object) {
    return YES;
  }
  if (![object isKindOfClass:[FBSDKProfile class]]) {
    return NO;
  }
  return [self isEqualToProfile:object];
}

- (BOOL)isEqualToProfile:(FBSDKProfile *)profile
{
  return ([_userID isEqualToString:profile.userID]
    && [_firstName isEqualToString:profile.firstName]
    && [_middleName isEqualToString:profile.middleName]
    && [_lastName isEqualToString:profile.lastName]
    && [_name isEqualToString:profile.name]
    && [_linkURL isEqual:profile.linkURL]
    && [_refreshDate isEqualToDate:profile.refreshDate])
  && [_imageURL isEqual:profile.imageURL]
  && [_email isEqualToString:profile.email];
}

 #pragma mark NSCoding

+ (BOOL)supportsSecureCoding
{
  return YES;
}

- (instancetype)initWithCoder:(NSCoder *)decoder
{
  NSString *userID = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDKPROFILE_USERID_KEY];
  NSString *firstName = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDKPROFILE_FIRSTNAME_KEY];
  NSString *middleName = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDKPROFILE_MIDDLENAME_KEY];
  NSString *lastName = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDKPROFILE_LASTNAME_KEY];
  NSString *name = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDKPROFILE_NAME_KEY];
  NSURL *linkURL = [decoder decodeObjectOfClass:[NSURL class] forKey:FBSDKPROFILE_LINKURL_KEY];
  NSDate *refreshDate = [decoder decodeObjectOfClass:[NSURL class] forKey:FBSDKPROFILE_REFRESHDATE_KEY];
  NSURL *imageURL = [decoder decodeObjectOfClass:[NSURL class] forKey:FBSDKPROFILE_IMAGEURL_KEY];
  NSString *email = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDKPROFILE_EMAIL_KEY];
  return [self initWithUserID:userID
                    firstName:firstName
                   middleName:middleName
                     lastName:lastName
                         name:name
                      linkURL:linkURL
                  refreshDate:refreshDate
                     imageURL:imageURL
                        email:email];
}

- (void)encodeWithCoder:(NSCoder *)encoder
{
  [encoder encodeObject:self.userID forKey:FBSDKPROFILE_USERID_KEY];
  [encoder encodeObject:self.firstName forKey:FBSDKPROFILE_FIRSTNAME_KEY];
  [encoder encodeObject:self.middleName forKey:FBSDKPROFILE_MIDDLENAME_KEY];
  [encoder encodeObject:self.lastName forKey:FBSDKPROFILE_LASTNAME_KEY];
  [encoder encodeObject:self.name forKey:FBSDKPROFILE_NAME_KEY];
  [encoder encodeObject:self.linkURL forKey:FBSDKPROFILE_LINKURL_KEY];
  [encoder encodeObject:self.refreshDate forKey:FBSDKPROFILE_REFRESHDATE_KEY];
  [encoder encodeObject:self.imageURL forKey:FBSDKPROFILE_IMAGEURL_KEY];
  [encoder encodeObject:self.email forKey:FBSDKPROFILE_EMAIL_KEY];
}

@end

@implementation FBSDKProfile (Internal)

 #pragma clang diagnostic push
 #pragma clang diagnostic ignored "-Wdeprecated-declarations"
+ (void)cacheProfile:(FBSDKProfile *)profile
{
  NSUserDefaults *userDefaults = [NSUserDefaults standardUserDefaults];
  if (profile) {
    NSData *data = [NSKeyedArchiver archivedDataWithRootObject:profile];
    [userDefaults setObject:data forKey:FBSDKProfileUserDefaultsKey];
  } else {
    [userDefaults removeObjectForKey:FBSDKProfileUserDefaultsKey];
  }
  [userDefaults synchronize];
}

+ (FBSDKProfile *)fetchCachedProfile
{
  NSUserDefaults *userDefaults = [NSUserDefaults standardUserDefaults];
  NSData *data = [userDefaults objectForKey:FBSDKProfileUserDefaultsKey];
  if (data != nil) {
    @try {
      return [NSKeyedUnarchiver unarchiveObjectWithData:data];
    } @catch (NSException *exception) {
      return nil;
    }
  }
  return nil;
}

+ (NSURL *)imageURLForProfileID:(NSString *)profileId
                    PictureMode:(FBSDKProfilePictureMode)mode
                           size:(CGSize)size
{
  NSString *const accessTokenKey = @"access_token";
  NSString *const pictureModeKey = @"type";
  NSString *const widthKey = @"width";
  NSString *const heightKey = @"height";

  NSString *type;
  switch (mode) {
    case FBSDKProfilePictureModeNormal: type = @"normal"; break;
    case FBSDKProfilePictureModeSquare: type = @"square"; break;
    case FBSDKProfilePictureModeSmall: type = @"small"; break;
    case FBSDKProfilePictureModeAlbum: type = @"album"; break;
    case FBSDKProfilePictureModeLarge: type = @"large"; break;
    default: type = @"normal";
  }

  NSMutableDictionary *queryParameters = [NSMutableDictionary dictionary];
  [FBSDKTypeUtility dictionary:queryParameters setObject:type forKey:pictureModeKey];
  [FBSDKTypeUtility dictionary:queryParameters setObject:@(roundf(size.width)) forKey:widthKey];
  [FBSDKTypeUtility dictionary:queryParameters setObject:@(roundf(size.height)) forKey:heightKey];

  if (FBSDKAccessToken.currentAccessToken) {
    [FBSDKTypeUtility dictionary:queryParameters setObject:FBSDKAccessToken.currentAccessToken.tokenString forKey:accessTokenKey];
  } else if (FBSDKSettings.clientToken) {
    [FBSDKTypeUtility dictionary:queryParameters setObject:FBSDKSettings.clientToken forKey:accessTokenKey];
  } else {
    NSLog(@"As of Graph API v8.0, profile images may not be retrieved without an access token. This can be the current access token from logging in with Facebook or it can be set via the plist or in code. Providing neither will cause this call to return a silhouette image.");
  }

  NSString *path = [NSString stringWithFormat:@"%@/picture", profileId];

  return [FBSDKInternalUtility facebookURLWithHostPrefix:@"graph"
                                                    path:path
                                         queryParameters:queryParameters
                                                   error:NULL];
}

+ (void)loadProfileWithToken:(FBSDKAccessToken *)token completion:(FBSDKProfileBlock)completion
{
  NSString *graphPath = @"me?fields=id,first_name,middle_name,last_name,name";
  if ([token.permissions containsObject:@"user_link"]) {
    graphPath = [graphPath stringByAppendingString:@",link"];
  }

  if ([token.permissions containsObject:@"email"]) {
    graphPath = [graphPath stringByAppendingString:@",email"];
  }

  FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc] initWithGraphPath:graphPath
                                                                 parameters:nil
                                                                      flags:FBSDKGraphRequestFlagDoNotInvalidateTokenOnError | FBSDKGraphRequestFlagDisableErrorRecovery];
  [[self class] loadProfileWithToken:token completion:completion graphRequest:request];
}

+ (void)loadProfileWithToken:(FBSDKAccessToken *)token
                  completion:(FBSDKProfileBlock)completion
                graphRequest:(FBSDKGraphRequest *)request
{
  FBSDKParseProfileBlock parseBlock = ^void (id result, FBSDKProfile **profileRef) {
    if (profileRef == NULL
        || result == nil
        || result[@"id"] == nil
        || ((NSString *) result[@"id"]).length == 0) {
      return;
    }
    NSString *urlString = [FBSDKTypeUtility stringValue:result[@"link"]];
    NSURL *linkUrl = [FBSDKTypeUtility URLValue:[NSURL URLWithString:urlString]];

    FBSDKProfile *profile = [[FBSDKProfile alloc] initWithUserID:result[@"id"]
                                                       firstName:result[@"first_name"]
                                                      middleName:result[@"middle_name"]
                                                        lastName:result[@"last_name"]
                                                            name:result[@"name"]
                                                         linkURL:linkUrl
                                                     refreshDate:[NSDate date]
                                                        imageURL:nil
                                                           email:result[@"email"]];
    *profileRef = [profile copy];
  };
  [[self class] loadProfileWithToken:token completion:completion graphRequest:request parseBlock:parseBlock];
}

+ (void)loadProfileWithToken:(FBSDKAccessToken *)token
                  completion:(FBSDKProfileBlock)completion
                graphRequest:(FBSDKGraphRequest *)request
                  parseBlock:(FBSDKParseProfileBlock)parseBlock;
{
  static FBSDKGraphRequestConnection *executingRequestConnection = nil;

  BOOL isStale = [[NSDate date] timeIntervalSinceDate:g_currentProfile.refreshDate] > FBSDKPROFILE_STALE_IN_SECONDS;
  if (token
      && (isStale || ![g_currentProfile.userID isEqualToString:token.userID])) {
    FBSDKProfile *expectedCurrentProfile = g_currentProfile;

    [executingRequestConnection cancel];
    executingRequestConnection = [request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection, id result, NSError *error) {
      if (expectedCurrentProfile != g_currentProfile) {
        // current profile has already changed since request was started. Let's not overwrite.
        if (completion != NULL) {
          completion(nil, nil);
        }
        return;
      }
      FBSDKProfile *profile = nil;
      if (!error) {
        parseBlock(result, &profile);
      }
      [[self class] setCurrentProfile:profile];
      if (completion != NULL) {
        completion(profile, error);
      }
    }];
  } else if (completion != NULL) {
    completion(g_currentProfile, nil);
  }
}

+ (void)observeChangeAccessTokenChange:(NSNotification *)notification
{
  FBSDKAccessToken *token = notification.userInfo[FBSDKAccessTokenChangeNewKey];
  [self loadProfileWithToken:token completion:NULL];
}

 #pragma clang diagnostic pop

@end

@implementation FBSDKProfile (Testing)

+ (void)resetCurrentProfileCache
{
  g_currentProfile = nil;
}

@end

#endif

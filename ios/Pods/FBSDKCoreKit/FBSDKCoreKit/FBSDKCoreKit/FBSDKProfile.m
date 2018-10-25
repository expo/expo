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

#import "FBSDKProfile+Internal.h"

#import "FBSDKCoreKit+Internal.h"

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
  if ((self = [super init])) {
    _userID = [userID copy];
    _firstName = [firstName copy];
    _middleName = [middleName copy];
    _lastName = [lastName copy];
    _name = [name copy];
    _linkURL = [linkURL copy];
    _refreshDate = [refreshDate copy] ?: [NSDate date];
  }
  return self;
}

+ (FBSDKProfile *)currentProfile
{
  return g_currentProfile;
}

+ (void)setCurrentProfile:(FBSDKProfile *)profile
{
  if (profile != g_currentProfile && ![profile isEqualToProfile:g_currentProfile]) {
    [[self class] cacheProfile:profile];
    NSMutableDictionary *userInfo = [NSMutableDictionary dictionary];

    [FBSDKInternalUtility dictionary:userInfo setObject:profile forKey:FBSDKProfileChangeNewKey];
    [FBSDKInternalUtility dictionary:userInfo setObject:g_currentProfile forKey:FBSDKProfileChangeOldKey];
    g_currentProfile = profile;
    [[NSNotificationCenter defaultCenter] postNotificationName:FBSDKProfileDidChangeNotification
                                                        object:[self class]
                                                      userInfo:userInfo];
  }
}

- (NSURL *)imageURLForPictureMode:(FBSDKProfilePictureMode)mode size:(CGSize)size
{
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  NSString *path = [self imagePathForPictureMode:mode size:size];
#pragma clang diagnostic pop
  return [FBSDKInternalUtility facebookURLWithHostPrefix:@"graph"
                                                    path:path
                                         queryParameters:nil
                                                   error:NULL];
}

- (NSString *)imagePathForPictureMode:(FBSDKProfilePictureMode)mode size:(CGSize)size
{
  NSString *type;
  switch (mode) {
    case FBSDKProfilePictureModeNormal: type = @"normal"; break;
    case FBSDKProfilePictureModeSquare: type = @"square"; break;
  }
  return [NSString stringWithFormat:@"%@/picture?type=%@&width=%d&height=%d",
          _userID,
          type,
          (int) roundf(size.width),
          (int) roundf(size.height)];
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

+ (void)loadCurrentProfileWithCompletion:(void (^)(FBSDKProfile *, NSError *))completion
{
  [self loadProfileWithToken:[FBSDKAccessToken currentAccessToken] completion:completion];
}

#pragma mark - NSCopying

- (instancetype)copyWithZone:(NSZone *)zone
{
  //immutable
  return self;
}

#pragma mark - Equality

- (NSUInteger)hash
{
  NSUInteger subhashes[] = {
    [self.userID hash],
    [self.firstName hash],
    [self.middleName hash],
    [self.lastName hash],
    [self.name hash],
    [self.linkURL hash],
    [self.refreshDate hash]
  };
  return [FBSDKMath hashWithIntegerArray:subhashes count:sizeof(subhashes) / sizeof(subhashes[0])];
}

- (BOOL)isEqual:(id)object
{
  if (self == object) {
    return YES;
  }
  if (![object isKindOfClass:[FBSDKProfile class]]){
    return NO;
  }
  return [self isEqualToProfile:object];
}

- (BOOL)isEqualToProfile:(FBSDKProfile *)profile
{
  return ([_userID isEqualToString:profile.userID] &&
          [_firstName isEqualToString:profile.firstName] &&
          [_middleName isEqualToString:profile.middleName] &&
          [_lastName isEqualToString:profile.lastName] &&
          [_name isEqualToString:profile.name] &&
          [_linkURL isEqual:profile.linkURL] &&
          [_refreshDate isEqualToDate:profile.refreshDate]);
}
#pragma mark NSCoding

+ (BOOL)supportsSecureCoding
{
  return YES;
}

- (id)initWithCoder:(NSCoder *)decoder
{
  NSString *userID = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDKPROFILE_USERID_KEY];
  NSString *firstName = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDKPROFILE_FIRSTNAME_KEY];
  NSString *middleName = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDKPROFILE_MIDDLENAME_KEY];
  NSString *lastName = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDKPROFILE_LASTNAME_KEY];
  NSString *name = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDKPROFILE_NAME_KEY];
  NSURL *linkURL = [decoder decodeObjectOfClass:[NSURL class] forKey:FBSDKPROFILE_LINKURL_KEY];
  NSDate *refreshDate = [decoder decodeObjectOfClass:[NSURL class] forKey:FBSDKPROFILE_REFRESHDATE_KEY];
  return [self initWithUserID:userID
                    firstName:firstName
                   middleName:middleName
                     lastName:lastName
                         name:name
                      linkURL:linkURL
                  refreshDate:refreshDate];
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
}

#pragma mark - Private

+ (void)loadProfileWithToken:(FBSDKAccessToken *)token completion:(void (^)(FBSDKProfile *, NSError *))completion
{
  static FBSDKGraphRequestConnection *executingRequestConnection = nil;

  BOOL isStale = [[NSDate date] timeIntervalSinceDate:g_currentProfile.refreshDate] > FBSDKPROFILE_STALE_IN_SECONDS;
  if (token &&
      (isStale || ![g_currentProfile.userID isEqualToString:token.userID])) {
    FBSDKProfile *expectedCurrentProfile = g_currentProfile;

    NSString *graphPath = @"me?fields=id,first_name,middle_name,last_name,name,link";
    [executingRequestConnection cancel];
    FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc] initWithGraphPath:graphPath
                                                                   parameters:nil
                                                                        flags:FBSDKGraphRequestFlagDoNotInvalidateTokenOnError | FBSDKGraphRequestFlagDisableErrorRecovery];
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
        profile = [[FBSDKProfile alloc] initWithUserID:result[@"id"]
                                             firstName:result[@"first_name"]
                                            middleName:result[@"middle_name"]
                                              lastName:result[@"last_name"]
                                                  name:result[@"name"]
                                               linkURL:[NSURL URLWithString:result[@"link"]]
                                           refreshDate:[NSDate date]];
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

@end

@implementation FBSDKProfile(Internal)

+ (void)cacheProfile:(FBSDKProfile *) profile
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

@end

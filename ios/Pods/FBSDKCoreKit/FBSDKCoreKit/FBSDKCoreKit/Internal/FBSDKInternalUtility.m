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

#import "FBSDKInternalUtility.h"

#import <sys/time.h>

#import <mach-o/dyld.h>

#import "FBSDKCoreKit+Internal.h"
#import "FBSDKError.h"
#import "FBSDKSettings+Internal.h"
#import "FBSDKSettings.h"
#import "FBSDKUtility.h"

typedef NS_ENUM(NSUInteger, FBSDKInternalUtilityVersionMask)
{
  FBSDKInternalUtilityMajorVersionMask = 0xFFFF0000,
  //FBSDKInternalUtilityMinorVersionMask = 0x0000FF00, // unused
  //FBSDKInternalUtilityPatchVersionMask = 0x000000FF, // unused
};

typedef NS_ENUM(NSUInteger, FBSDKInternalUtilityVersionShift)
{
  FBSDKInternalUtilityMajorVersionShift = 16,
  //FBSDKInternalUtilityMinorVersionShift = 8, // unused
  //FBSDKInternalUtilityPatchVersionShift = 0, // unused
};

@implementation FBSDKInternalUtility

#pragma mark - Class Methods

+ (NSString *)appURLScheme
{
  NSString *appID = ([FBSDKSettings appID] ?: @"");
  NSString *suffix = ([FBSDKSettings appURLSchemeSuffix] ?: @"");
  return [[NSString alloc] initWithFormat: @"fb%@%@", appID, suffix];
}

+ (NSURL *)appURLWithHost:(NSString *)host
                     path:(NSString *)path
          queryParameters:(NSDictionary *)queryParameters
                    error:(NSError *__autoreleasing *)errorRef
{
  return [self URLWithScheme:[self appURLScheme]
                        host:host
                        path:path
             queryParameters:queryParameters
                       error:errorRef];
}

+ (NSDictionary *)dictionaryFromFBURL:(NSURL *)url
{
  // version 3.2.3 of the Facebook app encodes the parameters in the query but
  // version 3.3 and above encode the parameters in the fragment;
  // merge them together with fragment taking priority.
  NSMutableDictionary *params = [NSMutableDictionary dictionary];
  [params addEntriesFromDictionary:[FBSDKUtility dictionaryWithQueryString:url.query]];

  // Only get the params from the fragment if it has authorize as the host
  if ([url.host isEqualToString:@"authorize"]) {
    [params addEntriesFromDictionary:[FBSDKUtility dictionaryWithQueryString:url.fragment]];
  }
  return params;
}

+ (void)array:(NSMutableArray *)array addObject:(id)object
{
  if (object) {
    [array addObject:object];
  }
}

+ (NSBundle *)bundleForStrings
{
  static NSBundle *bundle;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    NSString *stringsBundlePath = [[NSBundle bundleForClass:[FBSDKApplicationDelegate class]]
                                   pathForResource:@"FacebookSDKStrings"
                                   ofType:@"bundle"];
    bundle = [NSBundle bundleWithPath:stringsBundlePath] ?: [NSBundle mainBundle];
  });
  return bundle;
}

+ (id)convertRequestValue:(id)value
{
  if ([value isKindOfClass:[NSNumber class]]) {
    value = [(NSNumber *)value stringValue];
  } else if ([value isKindOfClass:[NSURL class]]) {
    value = [(NSURL *)value absoluteString];
  }
  return value;
}

+ (uint64_t)currentTimeInMilliseconds
{
  struct timeval time;
  gettimeofday(&time, NULL);
  return ((uint64_t)time.tv_sec * 1000) + (time.tv_usec / 1000);
}

+ (BOOL)dictionary:(NSMutableDictionary *)dictionary
setJSONStringForObject:(id)object
            forKey:(id<NSCopying>)key
             error:(NSError *__autoreleasing *)errorRef
{
  if (!object || !key) {
    return YES;
  }
  NSString *JSONString = [self JSONStringForObject:object error:errorRef invalidObjectHandler:NULL];
  if (!JSONString) {
    return NO;
  }
  [self dictionary:dictionary setObject:JSONString forKey:key];
  return YES;
}

+ (void)dictionary:(NSMutableDictionary *)dictionary setObject:(id)object forKey:(id<NSCopying>)key
{
  if (object && key) {
    [dictionary setObject:object forKey:key];
  }
}

+ (void)extractPermissionsFromResponse:(NSDictionary *)responseObject
                    grantedPermissions:(NSMutableSet *)grantedPermissions
                   declinedPermissions:(NSMutableSet *)declinedPermissions
{
  NSArray *resultData = responseObject[@"data"];
  if (resultData.count > 0) {
    for (NSDictionary *permissionsDictionary in resultData) {
      NSString *permissionName = permissionsDictionary[@"permission"];
      NSString *status = permissionsDictionary[@"status"];

      if ([status isEqualToString:@"granted"]) {
        [grantedPermissions addObject:permissionName];
      } else if ([status isEqualToString:@"declined"]) {
        [declinedPermissions addObject:permissionName];
      }
    }
  }
}

+ (NSURL *)facebookURLWithHostPrefix:(NSString *)hostPrefix
                                path:(NSString *)path
                     queryParameters:(NSDictionary *)queryParameters
                               error:(NSError *__autoreleasing *)errorRef
{
  return [self facebookURLWithHostPrefix:hostPrefix
                                    path:path
                         queryParameters:queryParameters
                          defaultVersion:nil
                                   error:errorRef];
}

+ (NSURL *)facebookURLWithHostPrefix:(NSString *)hostPrefix
                                path:(NSString *)path
                     queryParameters:(NSDictionary *)queryParameters
                      defaultVersion:(NSString *)defaultVersion
                               error:(NSError *__autoreleasing *)errorRef
{
  if ([hostPrefix length] && ![hostPrefix hasSuffix:@"."]) {
    hostPrefix = [hostPrefix stringByAppendingString:@"."];
  }

  NSString *host = @"facebook.com";
  NSString *domainPart = [FBSDKSettings facebookDomainPart];
  if ([domainPart length]) {
    host = [[NSString alloc] initWithFormat:@"%@.%@", domainPart, host];
  }
  host = [NSString stringWithFormat:@"%@%@", hostPrefix ?: @"", host ?: @""];

  NSString *version = defaultVersion ?: [FBSDKSettings graphAPIVersion];
  if ([version length]) {
    version = [@"/" stringByAppendingString:version];
  }

  if ([path length]) {
    NSScanner *versionScanner = [[NSScanner alloc] initWithString:path];
    if ([versionScanner scanString:@"/v" intoString:NULL] &&
        [versionScanner scanInteger:NULL] &&
        [versionScanner scanString:@"." intoString:NULL] &&
        [versionScanner scanInteger:NULL]) {
      [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorDeveloperErrors
                             logEntry:[NSString stringWithFormat:@"Invalid Graph API version:%@, assuming %@ instead",
                                       version,
                                       [FBSDKSettings graphAPIVersion]]];
      version = nil;
    }
    if (![path hasPrefix:@"/"]) {
      path = [@"/" stringByAppendingString:path];
    }
  }
  path = [[NSString alloc] initWithFormat:@"%@%@", version ?: @"", path ?: @""];

  return [self URLWithScheme:@"https"
                        host:host
                        path:path
             queryParameters:queryParameters
                       error:errorRef];
}

+ (BOOL)isBrowserURL:(NSURL *)URL
{
  NSString *scheme = [URL.scheme lowercaseString];
  return ([scheme isEqualToString:@"http"] || [scheme isEqualToString:@"https"]);
}

+ (BOOL)isFacebookBundleIdentifier:(NSString *)bundleIdentifier
{
  return ([bundleIdentifier hasPrefix:@"com.facebook."] ||
          [bundleIdentifier hasPrefix:@".com.facebook."]);
}

+ (BOOL)isOSRunTimeVersionAtLeast:(NSOperatingSystemVersion)version
{
  return ([self _compareOperatingSystemVersion:[self operatingSystemVersion] toVersion:version] != NSOrderedAscending);
}

+ (BOOL)isSafariBundleIdentifier:(NSString *)bundleIdentifier
{
  return ([bundleIdentifier isEqualToString:@"com.apple.mobilesafari"] ||
          [bundleIdentifier isEqualToString:@"com.apple.SafariViewService"]);
}

+ (BOOL)isUIKitLinkTimeVersionAtLeast:(FBSDKUIKitVersion)version
{
  static int32_t linkTimeMajorVersion;
  static dispatch_once_t getVersionOnce;
  dispatch_once(&getVersionOnce, ^{
    int32_t linkTimeVersion = NSVersionOfLinkTimeLibrary("UIKit");
    linkTimeMajorVersion = [self getMajorVersionFromFullLibraryVersion:linkTimeVersion];
  });
  return (version <= linkTimeMajorVersion);
}

+ (BOOL)isUIKitRunTimeVersionAtLeast:(FBSDKUIKitVersion)version
{
  static int32_t runTimeMajorVersion;
  static dispatch_once_t getVersionOnce;
  dispatch_once(&getVersionOnce, ^{
    int32_t runTimeVersion = NSVersionOfRunTimeLibrary("UIKit");
    runTimeMajorVersion = [self getMajorVersionFromFullLibraryVersion:runTimeVersion];
  });
  return (version <= runTimeMajorVersion);
}

+ (int32_t)getMajorVersionFromFullLibraryVersion:(int32_t)version
{
  // Negative values returned by NSVersionOfRunTimeLibrary/NSVersionOfLinkTimeLibrary
  // are still valid version numbers, as long as it's not -1.
  // After bitshift by 16, the negatives become valid positive major version number.
  // We ran into this first time with iOS 12.
  if (version != -1) {
    return ((version & FBSDKInternalUtilityMajorVersionMask) >> FBSDKInternalUtilityMajorVersionShift);
  } else {
    return 0;
  }
}

+ (NSString *)JSONStringForObject:(id)object
                            error:(NSError *__autoreleasing *)errorRef
             invalidObjectHandler:(id(^)(id object, BOOL *stop))invalidObjectHandler
{
  if (invalidObjectHandler || ![NSJSONSerialization isValidJSONObject:object]) {
    object = [self _convertObjectToJSONObject:object invalidObjectHandler:invalidObjectHandler stop:NULL];
    if (![NSJSONSerialization isValidJSONObject:object]) {
      if (errorRef != NULL) {
        *errorRef = [NSError fbInvalidArgumentErrorWithName:@"object"
                                                       value:object
                                                     message:@"Invalid object for JSON serialization."];
      }
      return nil;
    }
  }
  NSData *data = [NSJSONSerialization dataWithJSONObject:object options:0 error:errorRef];
  if (!data) {
    return nil;
  }
  return [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
}

+ (BOOL)object:(id)object isEqualToObject:(id)other;
{
  if (object == other) {
    return YES;
  }
  if (!object || !other) {
    return NO;
  }
  return [object isEqual:other];
}

+ (id)objectForJSONString:(NSString *)string error:(NSError *__autoreleasing *)errorRef
{
  NSData *data = [string dataUsingEncoding:NSUTF8StringEncoding];
  if (!data) {
    if (errorRef != NULL) {
      *errorRef = nil;
    }
    return nil;
  }
  return [NSJSONSerialization JSONObjectWithData:data options:NSJSONReadingAllowFragments error:errorRef];
}

+ (NSOperatingSystemVersion)operatingSystemVersion
{
  static NSOperatingSystemVersion operatingSystemVersion = {
    .majorVersion = 0,
    .minorVersion = 0,
    .patchVersion = 0,
  };
  static dispatch_once_t getVersionOnce;
  dispatch_once(&getVersionOnce, ^{
    if ([NSProcessInfo instancesRespondToSelector:@selector(operatingSystemVersion)]) {
      operatingSystemVersion = [NSProcessInfo processInfo].operatingSystemVersion;
    } else {
      NSArray *components = [[UIDevice currentDevice].systemVersion componentsSeparatedByString:@"."];
      switch (components.count) {
        default:
        case 3:
          operatingSystemVersion.patchVersion = [components[2] integerValue];
          // fall through
        case 2:
          operatingSystemVersion.minorVersion = [components[1] integerValue];
          // fall through
        case 1:
          operatingSystemVersion.majorVersion = [components[0] integerValue];
          break;
        case 0:
          operatingSystemVersion.majorVersion = ([self isUIKitLinkTimeVersionAtLeast:FBSDKUIKitVersion_7_0] ? 7 : 6);
          break;
      }
    }
  });
  return operatingSystemVersion;
}

+ (NSString *)queryStringWithDictionary:(NSDictionary *)dictionary
                                  error:(NSError *__autoreleasing *)errorRef
                   invalidObjectHandler:(id(^)(id object, BOOL *stop))invalidObjectHandler
{
  NSMutableString *queryString = [[NSMutableString alloc] init];
  __block BOOL hasParameters = NO;
  if (dictionary) {
    NSMutableArray *keys = [[dictionary allKeys] mutableCopy];
    // remove non-string keys, as they are not valid
    [keys filterUsingPredicate:[NSPredicate predicateWithBlock:^BOOL(id evaluatedObject, NSDictionary *bindings) {
      return [evaluatedObject isKindOfClass:[NSString class]];
    }]];
    // sort the keys so that the query string order is deterministic
    [keys sortUsingSelector:@selector(compare:)];
    BOOL stop = NO;
    for (NSString *key in keys) {
      id value = [self convertRequestValue:dictionary[key]];
      if ([value isKindOfClass:[NSString class]]) {
        value = [FBSDKUtility URLEncode:value];
      }
      if (invalidObjectHandler && ![value isKindOfClass:[NSString class]]) {
        value = invalidObjectHandler(value, &stop);
        if (stop) {
          break;
        }
      }
      if (value) {
        if (hasParameters) {
          [queryString appendString:@"&"];
        }
        [queryString appendFormat:@"%@=%@", key, value];
        hasParameters = YES;
      }
    }
  }
  if (errorRef != NULL) {
    *errorRef = nil;
  }
  return ([queryString length] ? [queryString copy] : nil);
}

+ (BOOL)shouldManuallyAdjustOrientation
{
  return (![self isUIKitLinkTimeVersionAtLeast:FBSDKUIKitVersion_8_0] ||
          ![self isUIKitRunTimeVersionAtLeast:FBSDKUIKitVersion_8_0]);
}

+ (NSURL *)URLWithScheme:(NSString *)scheme
                    host:(NSString *)host
                    path:(NSString *)path
         queryParameters:(NSDictionary *)queryParameters
                   error:(NSError *__autoreleasing *)errorRef
{
  if (![path hasPrefix:@"/"]) {
    path = [@"/" stringByAppendingString:path ?: @""];
  }

  NSString *queryString = nil;
  if ([queryParameters count]) {
    NSError *queryStringError;
    queryString = [@"?" stringByAppendingString:[FBSDKUtility queryStringWithDictionary:queryParameters
                                                                                  error:&queryStringError]];
    if (!queryString) {
      if (errorRef != NULL) {
        *errorRef = [NSError fbInvalidArgumentErrorWithName:@"queryParameters"
                                                       value:queryParameters
                                                     message:nil
                                             underlyingError:queryStringError];
      }
      return nil;
    }
  }

  NSURL *URL = [[NSURL alloc] initWithString:[NSString stringWithFormat:
                                              @"%@://%@%@%@",
                                              scheme ?: @"",
                                              host ?: @"",
                                              path ?: @"",
                                              queryString ?: @""]];
  if (errorRef != NULL) {
    if (URL) {
      *errorRef = nil;
    } else {
      *errorRef = [NSError fbUnknownErrorWithMessage:@"Unknown error building URL."];
    }
  }
  return URL;
}

+ (void)deleteFacebookCookies
{
  NSHTTPCookieStorage *cookies = [NSHTTPCookieStorage sharedHTTPCookieStorage];
  NSArray *facebookCookies = [cookies cookiesForURL:[self facebookURLWithHostPrefix:@"m."
                                                                               path:@"/dialog/"
                                                                    queryParameters:nil
                                                                              error:NULL]];

  for (NSHTTPCookie *cookie in facebookCookies) {
    [cookies deleteCookie:cookie];
  }
}

static NSMapTable *_transientObjects;

+ (void)registerTransientObject:(id)object
{
  NSAssert([NSThread isMainThread], @"Must be called from the main thread!");
  if (!_transientObjects) {
    _transientObjects = [[NSMapTable alloc] init];
  }
  NSUInteger count = [(NSNumber *)[_transientObjects objectForKey:object] unsignedIntegerValue];
  [_transientObjects setObject:@(count + 1) forKey:object];
}

+ (void)unregisterTransientObject:(__weak id)object
{
  if (!object) {
    return;
  }
  NSAssert([NSThread isMainThread], @"Must be called from the main thread!");
  NSUInteger count = [(NSNumber *)[_transientObjects objectForKey:object] unsignedIntegerValue];
  if (count == 1) {
    [_transientObjects removeObjectForKey:object];
  } else if (count != 0) {
    [_transientObjects setObject:@(count - 1) forKey:object];
  } else {
    [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorDeveloperErrors
                       formatString:@"unregisterTransientObject:%@ count is 0. This may indicate a bug in the FBSDK. Please"
     " file a report to developers.facebook.com/bugs if you encounter any problems. Thanks!", [object class]];
  }
}

+ (UIViewController *)viewControllerForView:(UIView *)view
{
  UIResponder *responder = view.nextResponder;
  while (responder) {
    if ([responder isKindOfClass:[UIViewController class]]) {
      return (UIViewController *)responder;
    }
    responder = responder.nextResponder;
  }
  return nil;
}

#pragma mark - FB Apps Installed

+ (BOOL)isFacebookAppInstalled
{
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    [FBSDKInternalUtility checkRegisteredCanOpenURLScheme:FBSDK_CANOPENURL_FACEBOOK];
  });
  return [self _canOpenURLScheme:FBSDK_CANOPENURL_FACEBOOK];
}

+ (BOOL)isMessengerAppInstalled
{
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    [FBSDKInternalUtility checkRegisteredCanOpenURLScheme:FBSDK_CANOPENURL_MESSENGER];
  });
  return [self _canOpenURLScheme:FBSDK_CANOPENURL_MESSENGER];
}

+ (BOOL)isMSQRDPlayerAppInstalled
{
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    [FBSDKInternalUtility checkRegisteredCanOpenURLScheme:FBSDK_CANOPENURL_MSQRD_PLAYER];
  });
  return [self _canOpenURLScheme:FBSDK_CANOPENURL_MSQRD_PLAYER];
}

#pragma mark - Helper Methods

+ (NSComparisonResult)_compareOperatingSystemVersion:(NSOperatingSystemVersion)version1
                                           toVersion:(NSOperatingSystemVersion)version2
{
  if (version1.majorVersion < version2.majorVersion) {
    return NSOrderedAscending;
  } else if (version1.majorVersion > version2.majorVersion) {
    return NSOrderedDescending;
  } else if (version1.minorVersion < version2.minorVersion) {
    return NSOrderedAscending;
  } else if (version1.minorVersion > version2.minorVersion) {
    return NSOrderedDescending;
  } else if (version1.patchVersion < version2.patchVersion) {
    return NSOrderedAscending;
  } else if (version1.patchVersion > version2.patchVersion) {
    return NSOrderedDescending;
  } else {
    return NSOrderedSame;
  }
}

+ (id)_convertObjectToJSONObject:(id)object
            invalidObjectHandler:(id(^)(id object, BOOL *stop))invalidObjectHandler
                            stop:(BOOL *)stopRef
{
  __block BOOL stop = NO;
  if ([object isKindOfClass:[NSString class]] || [object isKindOfClass:[NSNumber class]]) {
    // good to go, keep the object
  } else if ([object isKindOfClass:[NSURL class]]) {
    object = [(NSURL *)object absoluteString];
  } else if ([object isKindOfClass:[NSDictionary class]]) {
    NSMutableDictionary *dictionary = [[NSMutableDictionary alloc] init];
    [(NSDictionary *)object enumerateKeysAndObjectsUsingBlock:^(id key, id obj, BOOL *dictionaryStop) {
      [self dictionary:dictionary
             setObject:[self _convertObjectToJSONObject:obj invalidObjectHandler:invalidObjectHandler stop:&stop]
                forKey:[FBSDKTypeUtility stringValue:key]];
      if (stop) {
        *dictionaryStop = YES;
      }
    }];
    object = dictionary;
  } else if ([object isKindOfClass:[NSArray class]]) {
    NSMutableArray *array = [[NSMutableArray alloc] init];
    for (id obj in (NSArray *)object) {
      id convertedObj = [self _convertObjectToJSONObject:obj invalidObjectHandler:invalidObjectHandler stop:&stop];
      [self array:array addObject:convertedObj];
      if (stop) {
        break;
      }
    }
    object = array;
  } else {
    object = invalidObjectHandler(object, stopRef);
  }
  if (stopRef != NULL) {
    *stopRef = stop;
  }
  return object;
}

+ (BOOL)_canOpenURLScheme:(NSString *)scheme
{
  NSURLComponents *components = [[NSURLComponents alloc] init];
  components.scheme = scheme;
  components.path = @"/";
  return [[UIApplication sharedApplication] canOpenURL:components.URL];
}

+ (void)validateAppID
{
  if (![FBSDKSettings appID]) {
    NSString *reason = @"App ID not found. Add a string value with your app ID for the key "
                       @"FacebookAppID to the Info.plist or call [FBSDKSettings setAppID:].";
    @throw [NSException exceptionWithName:@"InvalidOperationException" reason:reason userInfo:nil];
  }
}

+ (NSString *)validateRequiredClientAccessToken {
  if (![FBSDKSettings clientToken]) {
    NSString *reason = @"ClientToken is required to be set for this operation. "
    @"Set the FacebookClientToken in the Info.plist or call [FBSDKSettings setClientToken:]. "
    @"You can find your client token in your App Settings -> Advanced.";
    @throw [NSException exceptionWithName:@"InvalidOperationException" reason:reason userInfo:nil];
  }
  return [NSString stringWithFormat:@"%@|%@", [FBSDKSettings appID], [FBSDKSettings clientToken]];
}

+ (void)validateURLSchemes
{
  [self validateAppID];
  NSString *defaultUrlScheme = [NSString stringWithFormat:@"fb%@%@", [FBSDKSettings appID], [FBSDKSettings appURLSchemeSuffix] ?: @""];
  if (![self isRegisteredURLScheme:defaultUrlScheme]) {
    NSString *reason = [NSString stringWithFormat:@"%@ is not registered as a URL scheme. Please add it in your Info.plist", defaultUrlScheme];
    @throw [NSException exceptionWithName:@"InvalidOperationException" reason:reason userInfo:nil];
  }
}

+ (void)validateFacebookReservedURLSchemes
{
  for (NSString * fbUrlScheme in @[FBSDK_CANOPENURL_FACEBOOK, FBSDK_CANOPENURL_MESSENGER, FBSDK_CANOPENURL_FBAPI, FBSDK_CANOPENURL_SHARE_EXTENSION]) {
    if ([self isRegisteredURLScheme:fbUrlScheme]) {
      NSString *reason = [NSString stringWithFormat:@"%@ is registered as a URL scheme. Please move the entry from CFBundleURLSchemes in your Info.plist to LSApplicationQueriesSchemes. If you are trying to resolve \"canOpenURL: failed\" warnings, those only indicate that the Facebook app is not installed on your device or simulator and can be ignored.", fbUrlScheme];
      @throw [NSException exceptionWithName:@"InvalidOperationException" reason:reason userInfo:nil];
    }
  }
}

+ (UIWindow *)findWindow
{
  UIWindow *window = [UIApplication sharedApplication].keyWindow;
  if (window == nil || window.windowLevel != UIWindowLevelNormal) {
    for (window in [UIApplication sharedApplication].windows) {
      if (window.windowLevel == UIWindowLevelNormal) {
        break;
      }
    }
  }
  if (window == nil) {
    [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorDeveloperErrors
                       formatString:@"Unable to find a valid UIWindow", nil];
  }
  return window;
}

+ (UIViewController *)topMostViewController
{
  UIWindow *keyWindow = [self findWindow];
  // SDK expects a key window at this point, if it is not, make it one
  if (keyWindow !=  nil && !keyWindow.isKeyWindow) {
    [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorDeveloperErrors
                       formatString:@"Unable to obtain a key window, marking %@ as keyWindow", keyWindow.description];
    [keyWindow makeKeyWindow];
  }

  UIViewController *topController = keyWindow.rootViewController;
  while (topController.presentedViewController) {
    topController = topController.presentedViewController;
  }
  return topController;
}

+ (NSString *)hexadecimalStringFromData:(NSData *)data
{
  NSUInteger dataLength = data.length;
  if (dataLength == 0) {
    return nil;
  }

  const unsigned char *dataBuffer = data.bytes;
  NSMutableString *hexString  = [NSMutableString stringWithCapacity:(dataLength * 2)];
  for (int i = 0; i < dataLength; ++i) {
    [hexString appendFormat:@"%02x", dataBuffer[i]];
  }
  return [hexString copy];
}

+ (BOOL)isRegisteredURLScheme:(NSString *)urlScheme {
  static dispatch_once_t fetchBundleOnce;
  static NSArray *urlTypes = nil;

  dispatch_once(&fetchBundleOnce, ^{
    urlTypes = [[[NSBundle mainBundle] infoDictionary] valueForKey:@"CFBundleURLTypes"];
  });
  for (NSDictionary *urlType in urlTypes) {
    NSArray *urlSchemes = [urlType valueForKey:@"CFBundleURLSchemes"];
    if ([urlSchemes containsObject:urlScheme]) {
      return YES;
    }
  }
  return NO;
}

+ (void)checkRegisteredCanOpenURLScheme:(NSString *)urlScheme
{
  static dispatch_once_t initCheckedSchemesOnce;
  static NSMutableSet *checkedSchemes = nil;

  dispatch_once(&initCheckedSchemesOnce, ^{
    checkedSchemes = [NSMutableSet set];
  });

  @synchronized(self) {
    if ([checkedSchemes containsObject:urlScheme]) {
      return;
    } else {
      [checkedSchemes addObject:urlScheme];
    }
  }

  if (![self isRegisteredCanOpenURLScheme:urlScheme]){
    NSString *reason = [NSString stringWithFormat:@"%@ is missing from your Info.plist under LSApplicationQueriesSchemes and is required for iOS 9.0", urlScheme];
    [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorDeveloperErrors logEntry:reason];
  }
}

+ (BOOL)isRegisteredCanOpenURLScheme:(NSString *)urlScheme
{
  static dispatch_once_t fetchBundleOnce;
  static NSArray *schemes = nil;

  dispatch_once(&fetchBundleOnce, ^{
    schemes = [[[NSBundle mainBundle] infoDictionary] valueForKey:@"LSApplicationQueriesSchemes"];
  });

  return [schemes containsObject:urlScheme];
}

+ (BOOL)isPublishPermission:(NSString *)permission
{
  return [permission hasPrefix:@"publish"] ||
  [permission hasPrefix:@"manage"] ||
  [permission isEqualToString:@"ads_management"] ||
  [permission isEqualToString:@"create_event"] ||
  [permission isEqualToString:@"rsvp_event"];
}

+ (BOOL)areAllPermissionsReadPermissions:(NSSet *)permissions
{
  for (NSString *permission in permissions) {
    if ([[self class] isPublishPermission:permission]) {
      return NO;
    }
  }
  return YES;
}

+ (BOOL)areAllPermissionsPublishPermissions:(NSSet *)permissions
{
  for (NSString *permission in permissions) {
    if (![[self class] isPublishPermission:permission]) {
      return NO;
    }
  }
  return YES;
}

+ (Class)resolveBoltsClassWithName:(NSString *)className;
{
  Class clazz = NSClassFromString(className);
  if (clazz == nil) {
    NSString *message = [NSString stringWithFormat:@"Unable to load class %@. Did you link Bolts.framework?", className];
    @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                   reason:message
                                 userInfo:nil];
  }

  return clazz;
}

+ (BOOL)isUnity
{
  NSString *userAgentSuffix = [FBSDKSettings userAgentSuffix];
  if (userAgentSuffix != nil && [userAgentSuffix rangeOfString:@"Unity"].location != NSNotFound) {
    return YES;
  }
  return NO;
}

@end

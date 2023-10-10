// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXManifestResource.h"
#import "EXApiUtil.h"
#import "EXEnvironment.h"
#import "EXFileDownloader.h"
#import "EXKernelLinkingManager.h"
#import "EXKernelUtil.h"
#import "EXVersions.h"

#import <React/RCTConvert.h>

@import EXManifests;
@import EXUpdates;

NSString * const kEXPublicKeyUrl = @"https://exp.host/--/manifest-public-key";
NSString * const EXRuntimeErrorDomain = @"incompatible-runtime";

@interface EXManifestResource ()

@property (nonatomic, strong) NSURL * _Nullable originalUrl;
@property (nonatomic, strong) NSData *data;
@property (nonatomic, assign) BOOL canBeWrittenToCache;

// cache this value so we only have to compute it once per instance
@property (nonatomic, strong) NSNumber * _Nullable isUsingEmbeddedManifest;

@end

@implementation EXManifestResource

- (instancetype)initWithManifestUrl:(NSURL *)url originalUrl:(NSURL * _Nullable)originalUrl
{
  _originalUrl = originalUrl;
  _canBeWrittenToCache = NO;
  
  NSString *resourceName = [EXKernelLinkingManager linkingUriForExperienceUri:url useLegacy:YES];
  
  if (self = [super initWithResourceName:resourceName resourceType:@"json" remoteUrl:url cachePath:[[self class] cachePath]]) {
    self.shouldVersionCache = NO;
  }
  return self;
}

- (NSMutableDictionary * _Nullable) _chooseJSONManifest:(NSArray *)jsonManifestObjArray error:(NSError **)error {
  // Find supported sdk versions
  if (jsonManifestObjArray) {
    for (id providedManifestJSON in jsonManifestObjArray) {
      if ([providedManifestJSON isKindOfClass:[NSDictionary class]]) {
        EXManifestsManifest *providedManifest = [EXManifestsManifestFactory manifestForManifestJSON:providedManifestJSON];
        NSString *sdkVersion = providedManifest.expoGoSDKVersion;
        if (sdkVersion && [[EXVersions sharedInstance] supportsVersion:sdkVersion]) {
          return providedManifestJSON;
        }
      }
    }
  }
  
  if (error) {
    * error = [self formatError:[NSError errorWithDomain:EXRuntimeErrorDomain code:0 userInfo:@{
      @"errorCode": @"NO_COMPATIBLE_EXPERIENCE_FOUND",
      NSLocalizedDescriptionKey: [NSString stringWithFormat:@"No compatible project found at %@. Only %@ are supported.", self.originalUrl, [[EXVersions sharedInstance].versions[@"sdkVersions"] componentsJoinedByString:@","]]
    }]];
  }
  return nil;
}

- (void)writeToCache
{
  if (_data) {
    NSString *resourceCachePath = [self resourceCachePath];
    NSLog(@"EXManifestResource: Caching manifest to %@...", resourceCachePath);
    [_data writeToFile:resourceCachePath atomically:YES];
  } else {
    _canBeWrittenToCache = YES;
  }
}

- (NSString *)resourceCachePath
{
  NSString *resourceCacheFilename = [NSString stringWithFormat:@"%@-%lu", self.resourceName, (unsigned long)[_originalUrl hash]];
  NSString *versionedResourceFilename = [NSString stringWithFormat:@"%@.%@", resourceCacheFilename, @"json"];
  return [[[self class] cachePath] stringByAppendingPathComponent:versionedResourceFilename];
}

- (BOOL)isUsingEmbeddedResource
{
  // return cached value if we've already computed it once
  if (_isUsingEmbeddedManifest != nil) {
    return [_isUsingEmbeddedManifest boolValue];
  }
  
  _isUsingEmbeddedManifest = @NO;
  
  if ([super isUsingEmbeddedResource]) {
    _isUsingEmbeddedManifest = @YES;
  } else {
    NSString *cachePath = [self resourceCachePath];
    NSString *bundlePath = [self resourceBundlePath];
    if (bundlePath) {
      // we cannot assume the cached manifest is newer than the embedded one, so we need to read both
      NSData *cachedData = [NSData dataWithContentsOfFile:cachePath];
      NSData *embeddedData = [NSData dataWithContentsOfFile:bundlePath];
      
      NSError *jsonErrorCached, *jsonErrorEmbedded;
      id cachedManifest, embeddedManifest;
      if (cachedData) {
        cachedManifest = [NSJSONSerialization JSONObjectWithData:cachedData options:kNilOptions error:&jsonErrorCached];
      }
      if (embeddedData) {
        embeddedManifest = [NSJSONSerialization JSONObjectWithData:embeddedData options:kNilOptions error:&jsonErrorEmbedded];
      }
      
      if (!jsonErrorCached && !jsonErrorEmbedded && [self _isUsingEmbeddedManifest:embeddedManifest withCachedManifest:cachedManifest]) {
        _isUsingEmbeddedManifest = @YES;
      }
    }
  }
  return [_isUsingEmbeddedManifest boolValue];
}

- (BOOL)_isUsingEmbeddedManifest:(id)embeddedManifest withCachedManifest:(id)cachedManifest
{
  // if there's no cachedManifest at resourceCachePath, we definitely want to use the embedded manifest
  if (embeddedManifest && !cachedManifest) {
    return YES;
  }
  
  NSDate *embeddedPublishDate = [self _publishedDateFromManifest:embeddedManifest];
  NSDate *cachedPublishDate;
  
  if (cachedManifest) {
    // cached manifests are signed so we have to parse the inner manifest
    NSString *cachedManifestString = cachedManifest[@"manifestString"];
    NSDictionary *innerCachedManifest;
    if (!cachedManifestString) {
      innerCachedManifest = cachedManifest;
    } else {
      NSError *jsonError;
      innerCachedManifest = [NSJSONSerialization JSONObjectWithData:[cachedManifestString dataUsingEncoding:NSUTF8StringEncoding]
                                                            options:kNilOptions
                                                              error:&jsonError];
      if (jsonError) {
        // just resolve with NO for now, we'll catch this error later on
        return NO;
      }
    }
    cachedPublishDate = [self _publishedDateFromManifest:innerCachedManifest];
  }
  if (embeddedPublishDate && cachedPublishDate && [embeddedPublishDate compare:cachedPublishDate] == NSOrderedDescending) {
    return YES;
  }
  return NO;
}

- (NSDate * _Nullable)_publishedDateFromManifest:(id)manifest
{
  if (manifest) {
    // use commitTime instead of publishTime as it is more accurate;
    // however, fall back to publishedTime in case older cached manifests do not contain
    // the commitTime key (we have not always served it)
    NSString *commitDateString = manifest[@"commitTime"];
    if (commitDateString) {
      return [RCTConvert NSDate:commitDateString];
    } else {
      NSString *publishDateString = manifest[@"publishedTime"];
      if (publishDateString) {
        return [RCTConvert NSDate:publishDateString];
      }
    }
  }
  return nil;
}

+ (NSString *)cachePath
{
  return [[self class] cachePathWithName:@"Manifests"];
}

- (BOOL)_isThirdPartyHosted
{
  return (self.remoteUrl && ![EXKernelLinkingManager isExpoHostedUrl:self.remoteUrl]);
}

- (BOOL)_isManifestVerificationBypassed: (id) manifestObj
{
  bool shouldBypassVerification =(
                                  // HACK: because `SecItemCopyMatching` doesn't work in older iOS (see EXApiUtil.m)
                                  ([UIDevice currentDevice].systemVersion.floatValue < 10) ||
                                  
                                  // we're using a copy that came with the NSBundle and was therefore already codesigned
                                  [self isUsingEmbeddedResource] ||
                                  
                                  // we sandbox third party hosted apps instead of verifying signature
                                  [self _isThirdPartyHosted]
                                  );
  
  return
  // only consider bypassing if there is no signature provided
  !((NSString *)manifestObj[@"signature"]) && shouldBypassVerification;
}

- (NSInteger)sdkVersionStringToInt:(nonnull NSString *)sdkVersion {
  NSRange snackSdkVersionRange = [sdkVersion rangeOfString: @"."];
  return [[sdkVersion substringToIndex: snackSdkVersionRange.location] intValue];
}

- (NSString *)supportedSdkVersionsConjunctionString:(nonnull NSString *)conjuction {
  NSArray *supportedSDKVersions = [EXVersions sharedInstance].versions[@"sdkVersions"];
  NSString *stringBeginning = [[supportedSDKVersions subarrayWithRange:NSMakeRange(0, supportedSDKVersions.count - 1)] componentsJoinedByString:@", "];
  return [NSString stringWithFormat:@"%@ %@ %@", stringBeginning, conjuction, [supportedSDKVersions lastObject]];
}

- (NSError *)verifyManifestSdkVersion:(EXManifestsManifest *)maybeManifest
{
  NSString *errorCode;
  NSDictionary *metadata;
  if (maybeManifest && maybeManifest.expoGoSDKVersion) {
    if (![maybeManifest.expoGoSDKVersion isEqualToString:@"UNVERSIONED"]) {
      NSInteger manifestSdkVersion = [maybeManifest.expoGoSDKVersion integerValue];
      if (manifestSdkVersion) {
        NSInteger oldestSdkVersion = [[self _earliestSdkVersionSupported] integerValue];
        NSInteger newestSdkVersion = [[self _latestSdkVersionSupported] integerValue];
        if (manifestSdkVersion < oldestSdkVersion) {
          errorCode = @"EXPERIENCE_SDK_VERSION_OUTDATED";
          // since we are spoofing this error, we put the SDK version of the project as the
          // "available" SDK version -- it's the only one available from the server
          metadata = @{@"availableSDKVersions": @[maybeManifest.expoGoSDKVersion]};
        }
        if (manifestSdkVersion > newestSdkVersion) {
          errorCode = @"EXPERIENCE_SDK_VERSION_TOO_NEW";
        }
        
        if ([[EXVersions sharedInstance].temporarySdkVersion integerValue] == manifestSdkVersion) {
          // It seems there is no matching versioned SDK,
          // but version of the unversioned code matches the requested one. That's ok.
          errorCode = nil;
        }
      } else {
        errorCode = @"MALFORMED_SDK_VERSION";
      }
    }
  } else {
    errorCode = @"NO_SDK_VERSION_SPECIFIED";
  }
  if (errorCode) {
    // will be handled by _validateErrorData:
    return [self formatError:[NSError errorWithDomain:EXRuntimeErrorDomain code:0 userInfo:@{
      @"errorCode": errorCode,
      @"metadata": metadata ?: @{},
    }]];
  } else {
    return nil;
  }
}

- (NSError *)_validateErrorData:(NSError *)error response:(NSURLResponse *)response
{
  NSError *formattedError;
  if ([response isKindOfClass:[NSHTTPURLResponse class]]) {
    // we got back a response from the server, and we can use the info we got back to make a nice
    // error message for the user
    
    formattedError = [self formatError:error];
  } else {
    // was a network error
    NSMutableDictionary *userInfo = [NSMutableDictionary dictionaryWithDictionary:error.userInfo];
    userInfo[@"errorCode"] = @"NETWORK_ERROR";
    formattedError = [NSError errorWithDomain:EXNetworkErrorDomain code:error.code userInfo:userInfo];
  }
  
  return [super _validateErrorData:formattedError response:response];
}

- (NSString *)_earliestSdkVersionSupported
{
  NSArray *clientSDKVersionsAvailable = [EXVersions sharedInstance].versions[@"sdkVersions"];
  return [clientSDKVersionsAvailable firstObject]; // TODO: this is bad, we can't guarantee this array will always be ordered properly.
}

- (NSString *)_latestSdkVersionSupported
{
  NSArray *clientSDKVersionsAvailable = [EXVersions sharedInstance].versions[@"sdkVersions"];
  return [clientSDKVersionsAvailable lastObject]; // TODO: this is bad, we can't guarantee this array will always be ordered properly.
}

- (NSError *)formatError:(NSError *)error
{
  NSMutableDictionary *userInfo = [NSMutableDictionary dictionaryWithDictionary:error.userInfo];
  NSString *errorCode = userInfo[@"errorCode"];
  NSString *rawMessage = [error localizedDescription];
  
  NSString *formattedMessage = [NSString stringWithFormat:@"Could not load %@.", self.originalUrl];
  if ([errorCode isEqualToString:@"EXPERIENCE_NOT_FOUND"]
      || [errorCode isEqualToString:@"EXPERIENCE_NOT_PUBLISHED_ERROR"]
      || [errorCode isEqualToString:@"EXPERIENCE_RELEASE_NOT_FOUND_ERROR"]) {
    formattedMessage = [NSString stringWithFormat:@"No project found at %@.", self.originalUrl];
  } else if ([errorCode isEqualToString:@"EXPERIENCE_SDK_VERSION_OUTDATED"]) {
    NSDictionary *metadata = userInfo[@"metadata"];
    NSArray *availableSDKVersions = metadata[@"availableSDKVersions"];
    NSString *sdkVersionRequired = [availableSDKVersions firstObject];
    NSString *supportedSDKVersions = [[EXVersions sharedInstance].versions[@"sdkVersions"] componentsJoinedByString:@", "];

    formattedMessage = [NSString stringWithFormat:@"This project uses SDK %@, but this version of Expo Go supports only SDKs %@. \n\n To open this project: \n • Update it to SDK %@. \n • Install an older version of Expo Go that supports the project's SDK version. \n\nIf you are unsure how to update the project or install a suitable version of Expo Go, refer to the https://docs.expo.dev/get-started/expo-go/#sdk-versions", sdkVersionRequired, [self supportedSdkVersionsConjunctionString:@"and"], [self supportedSdkVersionsConjunctionString:@"or"]];
  } else if ([errorCode isEqualToString:@"NO_SDK_VERSION_SPECIFIED"]) {
    NSString *supportedSDKVersions = [[EXVersions sharedInstance].versions[@"sdkVersions"] componentsJoinedByString:@", "];
    formattedMessage = [NSString stringWithFormat:@"Incompatible SDK version or no SDK version specified. This version of Expo Go only supports the following SDKs (runtimes): %@. A development build must be used to load other runtimes.\nhttps://docs.expo.dev/develop/development-builds/introduction/", supportedSDKVersions];
  } else if ([errorCode isEqualToString:@"EXPERIENCE_SDK_VERSION_TOO_NEW"]) {
    formattedMessage = @"The project you requested requires a newer version of Expo Go. Please download the latest version from the App Store.";
  } else if ([errorCode isEqualToString:@"NO_COMPATIBLE_EXPERIENCE_FOUND"]){
    formattedMessage = rawMessage; // No compatible experience found at ${originalUrl}. Only ${currentSdkVersions} are supported.
  } else if ([errorCode isEqualToString:@"EXPERIENCE_NOT_VIEWABLE"]) {
    formattedMessage = rawMessage; // From server: The experience you requested is not viewable by you. You will need to log in or ask the owner to grant you access.
  } else if ([errorCode isEqualToString:@"USER_SNACK_NOT_FOUND"] || [errorCode isEqualToString:@"SNACK_NOT_FOUND"]) {
    formattedMessage = [NSString stringWithFormat:@"No snack found at %@.", self.originalUrl];
  } else if ([errorCode isEqualToString:@"SNACK_RUNTIME_NOT_RELEASE"]) {
    formattedMessage = rawMessage; // From server: `The Snack runtime for corresponding sdk version of this Snack ("${sdkVersions[0]}") is not released.`,
  } else if ([errorCode isEqualToString:@"SNACK_NOT_FOUND_FOR_SDK_VERSION"]) {
    NSDictionary *metadata = userInfo[@"metadata"];
    NSString *fullName = metadata[@"fullName"];
    NSString *snackSdkVersion = metadata[@"sdkVersions"][0];
    NSInteger snackSdkVersionValue = [self sdkVersionStringToInt: snackSdkVersion];
    NSArray *supportedSdkVersions = [EXVersions sharedInstance].versions[@"sdkVersions"];
    NSInteger latestSupportedSdkVersionValue = [self sdkVersionStringToInt: supportedSdkVersions[0]];

    formattedMessage = [NSString stringWithFormat:@"The snack \"%@\" was found, but it is not compatible with your version of Expo Go. It was released for SDK %@, but your Expo Go supports only SDKs %@.", fullName, snackSdkVersion, [self supportedSdkVersionsConjunctionString:@"and"]];

    if (snackSdkVersionValue > latestSupportedSdkVersionValue) {
      formattedMessage = [NSString stringWithFormat:@"%@\n\nYou need to update your Expo Go app in order to run this snack.", formattedMessage];
    } else {
      formattedMessage = [NSString stringWithFormat:@"%@\n\nSnack needs to be upgraded to a current SDK version. To do it, open the project at https://snack.expo.dev. It will be automatically upgraded to a supported SDK version.", formattedMessage];
    }
    formattedMessage = [NSString stringWithFormat:@"%@\n\nLearn more about SDK versions and Expo Go in the https://docs.expo.dev/get-started/expo-go/#sdk-versions.", formattedMessage];
  }
  userInfo[NSLocalizedDescriptionKey] = formattedMessage;
  
  return [NSError errorWithDomain:EXRuntimeErrorDomain code:error.code userInfo:userInfo];
}

+ (NSString * _Nonnull)formatHeader:(NSError * _Nonnull)error {
  NSString *errorCode = error.userInfo[@"errorCode"];

  if ([errorCode isEqualToString:@"EXPERIENCE_SDK_VERSION_OUTDATED"]) {
    return @"Project is incompatible with this version of Expo Go" ;
  } else if ([errorCode isEqualToString:@"EXPERIENCE_SDK_VERSION_TOO_NEW"]) {
    return @"Project is incompatible with this version of Expo Go";
  } else if ([errorCode isEqualToString:@"SNACK_NOT_FOUND_FOR_SDK_VERSION"]) {
    return @"This Snack is incompatible with this version of Expo Go";
  }
  return nil;
}

+ (NSAttributedString * _Nonnull)addErrorStringHyperlinks:(NSString * _Nonnull)errorString {
  NSDictionary *linkMappings = @{
    @"https://docs.expo.dev/get-started/expo-go/#sdk-versions": @"SDK Versions Guide",
    @"https://snack.expo.dev": @"Expo Snack website",
    @"https://docs.expo.dev/develop/development-builds/introduction/": @"Learn more about development builds",
  };
  NSMutableAttributedString *attributedString = [[NSMutableAttributedString alloc] initWithString:errorString];

  for (NSString *link in linkMappings) {
    NSString *replacement = linkMappings[link];
    NSRange linkRange = [errorString rangeOfString:link];
    if (linkRange.location != NSNotFound) {
      [attributedString replaceCharactersInRange:linkRange withString:replacement];
      [attributedString addAttribute:NSLinkAttributeName value:link range:NSMakeRange(linkRange.location, replacement.length)];
    }
  }
  return attributedString;
}

@end

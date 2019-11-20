// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXManifestResource.h"
#import "EXAnalytics.h"
#import "EXApiUtil.h"
#import "EXEnvironment.h"
#import "EXFileDownloader.h"
#import "EXKernelLinkingManager.h"
#import "EXKernelUtil.h"
#import "EXVersions.h"

#import <React/RCTConvert.h>

NSString * const kEXPublicKeyUrl = @"https://exp.host/--/manifest-public-key";

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
  
  NSString *resourceName;
  if ([EXEnvironment sharedEnvironment].isDetached && [originalUrl.absoluteString isEqual:[EXEnvironment sharedEnvironment].standaloneManifestUrl]) {
    resourceName = kEXEmbeddedManifestResourceName;
    if ([EXEnvironment sharedEnvironment].releaseChannel){
      self.releaseChannel = [EXEnvironment sharedEnvironment].releaseChannel;
    }
    NSLog(@"EXManifestResource: Standalone manifest remote url is %@ (%@)", url, originalUrl);
  } else {
    resourceName = [EXKernelLinkingManager linkingUriForExperienceUri:url useLegacy:YES];
  }

  if (self = [super initWithResourceName:resourceName resourceType:@"json" remoteUrl:url cachePath:[[self class] cachePath]]) {
    self.shouldVersionCache = NO;
  }
  return self;
}

- (NSMutableDictionary * _Nullable) _chooseManifest:(NSArray *)manifestArray error:(NSError **)error {
  // Find supported sdk versions
  if (manifestArray) {
    for (id providedManifest in manifestArray) {
      if ([providedManifest isKindOfClass:[NSDictionary class]] && providedManifest[@"sdkVersion"]){
        NSString *sdkVersion = providedManifest[@"sdkVersion"];
        if ([[EXVersions sharedInstance] supportsVersion:sdkVersion]){
          return providedManifest;
        }
      }
    }
  }
  
  if (error) {
    * error = [self _formatError:[NSError errorWithDomain:EXNetworkErrorDomain code:0 userInfo:@{
                                                                                       @"errorCode": @"NO_COMPATIBLE_EXPERIENCE_FOUND",
                                                                                       NSLocalizedDescriptionKey: [NSString stringWithFormat:@"No compatible experience found at %@. Only %@ are supported.", self.originalUrl, [[EXVersions sharedInstance].versions[@"sdkVersions"] componentsJoinedByString:@","]]
                                                                                       }]];
  }
  return nil;
}

- (void)loadResourceWithBehavior:(EXCachedResourceBehavior)behavior
                   progressBlock:(EXCachedResourceProgressBlock)progressBlock
                    successBlock:(EXCachedResourceSuccessBlock)successBlock
                      errorBlock:(EXCachedResourceErrorBlock)errorBlock
{
  [super loadResourceWithBehavior:behavior progressBlock:progressBlock successBlock:^(NSData * _Nonnull data) {
    self->_data = data;
    if (self->_canBeWrittenToCache) {
      [self writeToCache];
    }

    __block NSError *jsonError;
    id manifestObjOrArray = [NSJSONSerialization JSONObjectWithData:data options:0 error:&jsonError];
    if (jsonError) {
      errorBlock(jsonError);
      return;
    }
    
    id manifestObj;
    // Check if server sent an array of manifests (multi-manifests)
    if ([manifestObjOrArray isKindOfClass:[NSArray class]]) {
      NSArray *manifestArray = (NSArray *)manifestObjOrArray;
      __block NSError *manifestError;
      manifestObj = [self _chooseManifest:(NSArray *)manifestArray error:&manifestError];
      if (!manifestObj) {
        errorBlock(manifestError);
        return;
      }
    } else {
      manifestObj = manifestObjOrArray;
    }
    NSString *innerManifestString = (NSString *)manifestObj[@"manifestString"];
    NSString *manifestSignature = (NSString *)manifestObj[@"signature"];
    
    NSMutableDictionary *innerManifestObj;
    if (!innerManifestString) {
      // this manifest is not signed
      innerManifestObj = [manifestObj mutableCopy];
    } else {
      @try {
        innerManifestObj = [NSJSONSerialization JSONObjectWithData:[innerManifestString dataUsingEncoding:NSUTF8StringEncoding]
                                        options:NSJSONReadingMutableContainers
                                          error:&jsonError];
      } @catch (NSException *exception) {
        errorBlock([NSError errorWithDomain:EXNetworkErrorDomain code:-1 userInfo:@{ NSLocalizedDescriptionKey: exception.reason }]);
      }
      if (jsonError) {
        errorBlock(jsonError);
        return;
      }
    }
    
    NSError *sdkVersionError = [self _verifyManifestSdkVersion:innerManifestObj];
    if (sdkVersionError) {
      errorBlock(sdkVersionError);
      return;
    }
    
    EXVerifySignatureSuccessBlock signatureSuccess = ^(BOOL isValid) {
      [innerManifestObj setObject:@(isValid) forKey:@"isVerified"];
      successBlock([NSJSONSerialization dataWithJSONObject:innerManifestObj options:0 error:&jsonError]);
    };
    
    if ([self _isManifestVerificationBypassed:manifestObj]) {
      if ([self _isThirdPartyHosted] && ![EXEnvironment sharedEnvironment].isDetached){
        // the manifest id determines the namespace/experience id an app is sandboxed with
        // if manifest is hosted by third parties, we sandbox it with the hostname to avoid clobbering exp.host namespaces
        // for https urls, sandboxed id is of form quinlanj.github.io/myProj-myApp
        // for http urls, sandboxed id is of form UNVERIFIED-quinlanj.github.io/myProj-myApp
        NSString * securityPrefix = [self.remoteUrl.scheme isEqualToString:@"https"] ? @"" : @"UNVERIFIED-";
        NSString * slugSuffix = innerManifestObj[@"slug"] ? [@"-" stringByAppendingString:innerManifestObj[@"slug"]]: @"";
        innerManifestObj[@"id"] = [NSString stringWithFormat:@"%@%@%@%@", securityPrefix, self.remoteUrl.host, self.remoteUrl.path?:@"", slugSuffix];
      }
      signatureSuccess(YES);
    } else {
      NSURL *publicKeyUrl = [NSURL URLWithString:kEXPublicKeyUrl];
      [EXApiUtil verifySignatureWithPublicKeyUrl:publicKeyUrl
                                           data:innerManifestString
                                      signature:manifestSignature
                                   successBlock:signatureSuccess
                                      errorBlock:^(NSError *error) {
                                        // ignore network errors in manifest validation,
                                        // otherwise we can break offline loading for standalone apps when they have a valid manifest cache but no key.
                                        if (error.domain == NSURLErrorDomain || error.domain == EXNetworkErrorDomain) {
                                          DDLogWarn(@"EXManifestResource: Ignoring network error when validating manifest");
                                          signatureSuccess(YES);
                                        } else {
                                          errorBlock(error);
                                        }
                                      }];
    }
  } errorBlock:errorBlock];
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
                                  
                                  // the developer disabled manifest verification
                                  [EXEnvironment sharedEnvironment].isManifestVerificationBypassed ||
                                  
                                  // we're using a copy that came with the NSBundle and was therefore already codesigned
                                  [self isUsingEmbeddedResource] ||
                                  
                                  // we sandbox third party hosted apps instead of verifying signature
                                  [self _isThirdPartyHosted]
                                  );
  
  return
  // only consider bypassing if there is no signature provided
  !((NSString *)manifestObj[@"signature"]) && shouldBypassVerification;
}

- (NSError *)_validateResponseData:(NSData *)data response:(NSURLResponse *)response
{
  if (response && [response isKindOfClass:[NSHTTPURLResponse class]]) {
    NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)response;
    NSDictionary *headers = httpResponse.allHeaderFields;

    // pass the Exponent-Server header to Amplitude if it exists.
    // this is generated only from XDE and exp while serving local bundles.
    NSString *serverHeaderJson = headers[@"Exponent-Server"];
    if (serverHeaderJson) {
      NSError *jsonError;
      NSDictionary *serverHeader = [NSJSONSerialization JSONObjectWithData:[serverHeaderJson dataUsingEncoding:NSUTF8StringEncoding] options:0 error:&jsonError];
      if (serverHeader && !jsonError) {
        [[EXAnalytics sharedInstance] logEvent:@"LOAD_DEVELOPER_MANIFEST" manifestUrl:response.URL eventProperties:serverHeader];
      }
    }
  }
  // indicate that the response is valid
  return nil;
}

- (NSError *)_verifyManifestSdkVersion:(NSDictionary *)maybeManifest
{
  NSString *errorCode;
  if (maybeManifest && maybeManifest[@"sdkVersion"]) {
    if (![maybeManifest[@"sdkVersion"] isEqualToString:@"UNVERSIONED"]) {
      NSInteger manifestSdkVersion = [maybeManifest[@"sdkVersion"] integerValue];
      if (manifestSdkVersion) {
        NSInteger oldestSdkVersion = [[self _earliestSdkVersionSupported] integerValue];
        NSInteger newestSdkVersion = [[self _latestSdkVersionSupported] integerValue];
        if (manifestSdkVersion < oldestSdkVersion) {
          errorCode = @"EXPERIENCE_SDK_VERSION_OUTDATED";
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
    return [self _formatError:[NSError errorWithDomain:EXNetworkErrorDomain code:0 userInfo:@{
      @"errorCode": errorCode,
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
    
    formattedError = [self _formatError:error];
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

- (NSError *)_formatError:(NSError *)error
{
  NSMutableDictionary *userInfo = [NSMutableDictionary dictionaryWithDictionary:error.userInfo];
  NSString *errorCode = userInfo[@"errorCode"];
  NSString *rawMessage = [error localizedDescription];
  
  NSString *formattedMessage = [NSString stringWithFormat:@"Could not load %@.", self.originalUrl];
  if ([errorCode isEqualToString:@"EXPERIENCE_NOT_FOUND"]
      || [errorCode isEqualToString:@"EXPERIENCE_NOT_PUBLISHED_ERROR"]
      || [errorCode isEqualToString:@"EXPERIENCE_RELEASE_NOT_FOUND_ERROR"]) {
    formattedMessage = [NSString stringWithFormat:@"No experience found at %@.", self.originalUrl];
  } else if ([errorCode isEqualToString:@"EXPERIENCE_SDK_VERSION_OUTDATED"]) {
    NSDictionary *metadata = userInfo[@"metadata"];
    NSArray *availableSDKVersions = metadata[@"availableSDKVersions"];
    NSString *sdkVersionRequired = [availableSDKVersions firstObject];
    
    NSString *earliestSDKVersion = [self _earliestSdkVersionSupported];
    formattedMessage = [NSString stringWithFormat:@"The experience you requested uses Expo SDK v%@, but this copy of Expo Client "
                        "requires at least v%@. The author should update their experience to a newer Expo SDK version.", sdkVersionRequired, earliestSDKVersion];
  } else if ([errorCode isEqualToString:@"EXPERIENCE_SDK_VERSION_TOO_NEW"]) {
    formattedMessage = @"The experience you requested requires a newer version of the Expo Client app. Please download the latest version from the App Store.";
  } else if ([errorCode isEqualToString:@"NO_COMPATIBLE_EXPERIENCE_FOUND"]){
    formattedMessage = rawMessage; // No compatible experience found at ${originalUrl}. Only ${currentSdkVersions} are supported.
  } else if ([errorCode isEqualToString:@"EXPERIENCE_NOT_VIEWABLE"]) {
    formattedMessage = rawMessage; // From server: The experience you requested is not viewable by you. You will need to log in or ask the owner to grant you access.
  } else if ([errorCode isEqualToString:@"USER_SNACK_NOT_FOUND"] || [errorCode isEqualToString:@"SNACK_NOT_FOUND"]) {
    formattedMessage = [NSString stringWithFormat:@"No snack found at %@.", self.originalUrl];
  } else if ([errorCode isEqualToString:@"SNACK_RUNTIME_NOT_RELEASE"]) {
    formattedMessage = rawMessage; // From server: `The Snack runtime for corresponding sdk version of this Snack ("${sdkVersions[0]}") is not released.`,
  } else if ([errorCode isEqualToString:@"SNACK_NOT_FOUND_FOR_SDK_VERSIONS"]) {
    formattedMessage = rawMessage; // From server: `The snack "${fullName}" was found, but wasn't released for platform "${platform}" and sdk version "${sdkVersions[0]}".`
  }
  userInfo[NSLocalizedDescriptionKey] = formattedMessage;
  
  return [NSError errorWithDomain:EXNetworkErrorDomain code:error.code userInfo:userInfo];
}

@end

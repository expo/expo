// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXManifestResource.h"
#import "EXAnalytics.h"
#import "EXApiUtil.h"
#import "EXFileDownloader.h"
#import "EXKernelLinkingManager.h"
#import "EXKernelUtil.h"
#import "EXShellManager.h"
#import "EXVersions.h"

NSString * const kEXPublicKeyUrl = @"https://exp.host/--/manifest-public-key";

@interface EXManifestResource ()

@property (nonatomic, strong) NSURL * _Nullable originalUrl;

@end

@implementation EXManifestResource

- (instancetype)initWithManifestUrl:(NSURL *)url originalUrl:(NSURL * _Nullable)originalUrl
{
  _originalUrl = originalUrl;
  
  NSString *resourceName;
  if ([EXShellManager sharedInstance].isShell && [originalUrl.absoluteString isEqual:[EXShellManager sharedInstance].shellManifestUrl]) {
    resourceName = kEXShellManifestResourceName;
    if ([EXShellManager sharedInstance].releaseChannel){
      self.releaseChannel = [EXShellManager sharedInstance].releaseChannel;
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

- (void)loadResourceWithBehavior:(EXCachedResourceBehavior)behavior
                   progressBlock:(EXCachedResourceProgressBlock)progressBlock
                    successBlock:(EXCachedResourceSuccessBlock)successBlock
                      errorBlock:(EXCachedResourceErrorBlock)errorBlock
{
  [super loadResourceWithBehavior:behavior progressBlock:progressBlock successBlock:^(NSData * _Nonnull data) {
    __block NSError *jsonError;
    id manifestObj = [NSJSONSerialization JSONObjectWithData:data options:0 error:&jsonError];
    if (jsonError) {
      errorBlock(jsonError);
      return;
    }

    NSString *innerManifestString = (NSString *)manifestObj[@"manifestString"];
    NSString *manifestSignature = (NSString *)manifestObj[@"signature"];
    
    NSMutableDictionary *innerManifestObj;
    if (!innerManifestString && [self isLocalPathFromNSBundle]) {
      // locally bundled manifests are not signed
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
    
    if ([self _isManifestVerificationBypassed]) {
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

+ (NSString *)cachePath
{
  NSString *cachesDirectory = NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES).firstObject;
  NSString *sourceDirectory = [cachesDirectory stringByAppendingPathComponent:@"Manifests"];
  
  BOOL cacheDirectoryExists = [[NSFileManager defaultManager] fileExistsAtPath:sourceDirectory isDirectory:nil];
  if (!cacheDirectoryExists) {
    NSError *error;
    BOOL created = [[NSFileManager defaultManager] createDirectoryAtPath:sourceDirectory
                                             withIntermediateDirectories:YES
                                                              attributes:nil
                                                                   error:&error];
    if (created) {
      cacheDirectoryExists = YES;
    } else {
      DDLogError(@"Could not create source cache directory: %@", error.localizedDescription);
    }
  }
  
  return (cacheDirectoryExists) ? sourceDirectory : nil;
}

- (BOOL)_isManifestVerificationBypassed
{
  return (
          // HACK: because `SecItemCopyMatching` doesn't work in older iOS (see EXApiUtil.m)
          ([UIDevice currentDevice].systemVersion.floatValue < 10) ||
          
          // the developer disabled manifest verification
          [EXShellManager sharedInstance].isManifestVerificationBypassed ||
          
          // we're using a copy that came with the NSBundle and was therefore already codesigned
          [self isLocalPathFromNSBundle]
  );
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

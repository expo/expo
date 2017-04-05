// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXManifestResource.h"
#import "EXAnalytics.h"
#import "EXApiUtil.h"
#import "EXFileDownloader.h"
#import "EXKernel.h"
#import "EXShellManager.h"

NSString * const kEXPublicKeyUrl = @"https://exp.host/--/manifest-public-key";

@implementation EXManifestResource

- (instancetype)initWithManifestUrl:(NSURL *)url originalUrl:(NSURL * _Nullable)originalUrl
{
  NSString *resourceName;
  if ([EXShellManager sharedInstance].isShell && [originalUrl.absoluteString isEqual:[EXShellManager sharedInstance].shellManifestUrl]) {
    resourceName = kEXShellManifestResourceName;
    NSLog(@"EXManifestResource: Standalone manifest remote url is %@ (%@)", url, originalUrl);
  } else {
    resourceName = [EXKernel linkingUriForExperienceUri:url];
  }

  if (self = [super initWithResourceName:resourceName resourceType:@"json" remoteUrl:url cachePath:[[self class] cachePath]]) {
    self.shouldVersionCache = NO;
  }
  return self;
}

- (void)loadResourceWithBehavior:(EXCachedResourceBehavior)behavior
                    successBlock:(EXCachedResourceSuccessBlock)successBlock
                      errorBlock:(EXCachedResourceErrorBlock)errorBlock
{
  [super loadResourceWithBehavior:behavior successBlock:^(NSData * _Nonnull data) {
    NSError *jsonError;
    id manifestObj = [NSJSONSerialization JSONObjectWithData:data options:0 error:&jsonError];
    if (jsonError) {
      errorBlock(jsonError);
      return;
    }

    NSString *innerManifestString = (NSString *)manifestObj[@"manifestString"];
    NSString *manifestSignature = (NSString *)manifestObj[@"signature"];

    EXVerifySignatureSuccessBlock signatureSuccess = ^(BOOL isValid) {
      NSError *jsonError;
      NSMutableDictionary *manifestObj =
        [NSJSONSerialization JSONObjectWithData:[innerManifestString dataUsingEncoding:NSUTF8StringEncoding]
                                        options:NSJSONReadingMutableContainers
                                          error:&jsonError];
      if (jsonError) {
        errorBlock(jsonError);
        return;
      }

      if ([self _isManifestVerificationBypassed]) {
        isValid = YES;
      }
      [manifestObj setObject:@(isValid) forKey:@"isVerified"];

      successBlock([NSJSONSerialization dataWithJSONObject:manifestObj options:0 error:&jsonError]);
    };

    if (innerManifestString && manifestSignature) {
      NSURL *publicKeyUrl = [NSURL URLWithString:kEXPublicKeyUrl];
      [EXApiUtil verifySignatureWithPublicKeyUrl:publicKeyUrl
                                           data:innerManifestString
                                      signature:manifestSignature
                                   successBlock:signatureSuccess
                                     errorBlock:errorBlock];
    } else {
      errorBlock([NSError errorWithDomain:EXNetworkErrorDomain code:-1 userInfo:@{ NSLocalizedDescriptionKey: @"Cannot verify the manifest because it has no signature." }]);
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
  // HACK: because `SecItemCopyMatching` doesn't work in older iOS (see EXApiUtil.m)
  return (([UIDevice currentDevice].systemVersion.floatValue < 10) ||
          [EXShellManager sharedInstance].isManifestVerificationBypassed);
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

@end

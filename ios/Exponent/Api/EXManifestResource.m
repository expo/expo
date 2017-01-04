// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXManifestResource.h"
#import "EXCrypto.h"
#import "EXKernel.h"
#import "EXShellManager.h"

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

      [manifestObj setObject:@(isValid) forKey:@"isVerified"];

      successBlock([NSJSONSerialization dataWithJSONObject:manifestObj options:0 error:&jsonError]);
    };

    if (innerManifestString && manifestSignature) {
      NSURL *publicKeyUrl = [NSURL URLWithString:@"https://exp.host/--/manifest-public-key"];
      [[EXCrypto sharedInstance] verifySignatureWithPublicKeyUrl:publicKeyUrl
                                                            data:innerManifestString
                                                       signature:manifestSignature
                                                    successBlock:signatureSuccess
                                                      errorBlock:errorBlock];
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

@end

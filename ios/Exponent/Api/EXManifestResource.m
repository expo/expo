// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXManifestResource.h"
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

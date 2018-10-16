// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXFileSystem/EXFileSystemManagerService.h>
#import <EXCore/EXDefines.h>

// TODO @sjchmiela: Should this be versioned? It is only used in detached scenario.
NSString * const EXShellManifestResourceName = @"shell-app-manifest";

@implementation EXFileSystemManagerService

EX_REGISTER_MODULE()

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(EXFileSystemManager)];
}

- (NSString *)bundleDirectoryForExperienceId:(NSString *)experienceId
{
  return [NSBundle mainBundle].bundlePath;
}

- (NSArray<NSString *> *)bundledAssetsForExperienceId:(NSString *)experienceId
{
  static NSArray<NSString *> *bundledAssets = nil;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    NSString *manifestBundlePath = [[NSBundle mainBundle] pathForResource:EXShellManifestResourceName ofType:@"json"];
    NSData *data = [NSData dataWithContentsOfFile:manifestBundlePath];
    if (data.length == 0) {
      return;
    }
    __block NSError *error;
    id manifest = [NSJSONSerialization JSONObjectWithData:data options:0 error:&error];
    if (error) {
      EXLogError(@"Error parsing bundled manifest: %@", error);
      return;
    }
    bundledAssets = manifest[@"bundledAssets"];
  });
  return bundledAssets;
}

@end


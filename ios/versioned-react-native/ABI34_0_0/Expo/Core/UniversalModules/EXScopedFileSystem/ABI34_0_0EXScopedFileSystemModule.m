// Copyright 2015-present 650 Industries. All rights reserved.

#if __has_include(<ABI34_0_0EXFileSystem/ABI34_0_0EXFileSystem.h>)
#import "ABI34_0_0EXScopedFileSystemModule.h"

// TODO @sjchmiela: Should this be versioned? It is only used in detached scenario.
NSString * const ABI34_0_0EXShellManifestResourceName = @"shell-app-manifest";

@implementation ABI34_0_0EXScopedFileSystemModule

- (instancetype)initWithExperienceId:(NSString *)experienceId andConstantsBinding:(ABI34_0_0EXConstantsBinding *)constantsBinding
{
  NSString *escapedExperienceId = [ABI34_0_0EXScopedFileSystemModule escapedResourceName:experienceId];

  NSString *mainDocumentDirectory = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES).firstObject;
  NSString *exponentDocumentDirectory = [mainDocumentDirectory stringByAppendingPathComponent:@"ExponentExperienceData"];
  NSString *experienceDocumentDirectory = [[exponentDocumentDirectory stringByAppendingPathComponent:escapedExperienceId] stringByStandardizingPath];

  NSString *mainCachesDirectory = NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES).firstObject;
  NSString *exponentCachesDirectory = [mainCachesDirectory stringByAppendingPathComponent:@"ExponentExperienceData"];
  NSString *experienceCachesDirectory = [[exponentCachesDirectory stringByAppendingPathComponent:escapedExperienceId] stringByStandardizingPath];

  if (![@"expo" isEqualToString:constantsBinding.appOwnership]) {
    [self ensureOldFilesAreMigratedFrom:experienceDocumentDirectory to:mainDocumentDirectory];

    return [super init];
  }

  return [super initWithDocumentDirectory:experienceDocumentDirectory
                          cachesDirectory:experienceCachesDirectory
                          bundleDirectory:nil];
}

- (NSDictionary *)constantsToExport
{
  NSMutableDictionary *constants = [[NSMutableDictionary alloc] initWithDictionary:[super constantsToExport]];
  constants[@"bundledAssets"] = [self bundledAssets] ?: [NSNull null];
  return constants;
}

+ (NSString *)escapedResourceName:(NSString *)name
{
  NSString *charactersToEscape = @"!*'();:@&=+$,/?%#[]";
  NSCharacterSet *allowedCharacters = [[NSCharacterSet characterSetWithCharactersInString:charactersToEscape] invertedSet];
  return [name stringByAddingPercentEncodingWithAllowedCharacters:allowedCharacters];
}

- (NSArray<NSString *> *)bundledAssets
{
  static NSArray<NSString *> *bundledAssets = nil;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    NSString *manifestBundlePath = [[NSBundle mainBundle] pathForResource:ABI34_0_0EXShellManifestResourceName ofType:@"json"];
    NSData *data = [NSData dataWithContentsOfFile:manifestBundlePath];
    if (data.length == 0) {
      return;
    }
    __block NSError *error;
    id manifest = [NSJSONSerialization JSONObjectWithData:data options:0 error:&error];
    if (error) {
      ABI34_0_0UMLogError(@"Error parsing bundled manifest: %@", error);
      return;
    }
    bundledAssets = manifest[@"bundledAssets"];
  });
  return bundledAssets;
}

// This method ensures that data are migrated from the old scoped path to the new, unscoped one.
// It needs to be called in case somebody wants to update their standalone app.
// This method can be removed when SDK32 is phased out.
- (void)ensureOldFilesAreMigratedFrom:(NSString *)fromDirectory to:(NSString *)toDirectory
{
  NSFileManager *fileManager = [NSFileManager defaultManager];
  if ([fileManager fileExistsAtPath:fromDirectory]) {
    NSArray<NSString *> *files = [fileManager contentsOfDirectoryAtPath:fromDirectory error:nil];

    for (NSString *file in files) {
      [fileManager moveItemAtPath:[fromDirectory stringByAppendingPathComponent:file]
                           toPath:[toDirectory stringByAppendingPathComponent:file]
                            error:nil];
    }
    [fileManager removeItemAtPath:fromDirectory error:nil];
  }
}

@end
#endif

// Copyright 2015-present 650 Industries. All rights reserved.

#if __has_include(<ABI37_0_0EXFileSystem/ABI37_0_0EXFileSystem.h>)
#import "ABI37_0_0EXScopedFileSystemModule.h"

// TODO @sjchmiela: Should this be versioned? It is only used in detached scenario.
NSString * const ABI37_0_0EXShellManifestResourceName = @"shell-app-manifest";

@implementation ABI37_0_0EXScopedFileSystemModule

- (instancetype)initWithExperienceId:(NSString *)experienceId andConstantsBinding:(ABI37_0_0EXConstantsBinding *)constantsBinding
{
  NSString *escapedExperienceId = [ABI37_0_0EXScopedFileSystemModule escapedResourceName:experienceId];

  NSString *mainDocumentDirectory = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES).firstObject;
  NSString *exponentDocumentDirectory = [mainDocumentDirectory stringByAppendingPathComponent:@"ExponentExperienceData"];
  NSString *experienceDocumentDirectory = [[exponentDocumentDirectory stringByAppendingPathComponent:escapedExperienceId] stringByStandardizingPath];

  NSString *mainCachesDirectory = NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES).firstObject;
  NSString *exponentCachesDirectory = [mainCachesDirectory stringByAppendingPathComponent:@"ExponentExperienceData"];
  NSString *experienceCachesDirectory = [[exponentCachesDirectory stringByAppendingPathComponent:escapedExperienceId] stringByStandardizingPath];

  if (![@"expo" isEqualToString:constantsBinding.appOwnership]) {
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
    NSString *manifestBundlePath = [[NSBundle mainBundle] pathForResource:ABI37_0_0EXShellManifestResourceName ofType:@"json"];
    NSData *data = [NSData dataWithContentsOfFile:manifestBundlePath];
    if (data.length == 0) {
      return;
    }
    __block NSError *error;
    id manifest = [NSJSONSerialization JSONObjectWithData:data options:0 error:&error];
    if (error) {
      ABI37_0_0UMLogError(@"Error parsing bundled manifest: %@", error);
      return;
    }
    bundledAssets = manifest[@"bundledAssets"];
  });
  return bundledAssets;
}

@end
#endif

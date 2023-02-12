// Copyright 2015-present 650 Industries. All rights reserved.

#if __has_include(<ABI47_0_0EXFileSystem/ABI47_0_0EXFileSystem.h>)
#import "ABI47_0_0EXScopedFileSystemModule.h"
#import "ABI47_0_0EXUtil.h"

// TODO @sjchmiela: Should this be versioned? It is only used in detached scenario.
NSString * const ABI47_0_0EXShellManifestResourceName = @"shell-app-manifest";

@implementation ABI47_0_0EXScopedFileSystemModule

- (NSDictionary *)constantsToExport
{
  NSMutableDictionary *constants = [[NSMutableDictionary alloc] initWithDictionary:[super constantsToExport]];
  constants[@"bundledAssets"] = [self bundledAssets] ?: [NSNull null];
  return constants;
}

- (NSArray<NSString *> *)bundledAssets
{
  static NSArray<NSString *> *bundledAssets = nil;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    NSString *manifestBundlePath = [[NSBundle mainBundle] pathForResource:ABI47_0_0EXShellManifestResourceName ofType:@"json"];
    NSData *data = [NSData dataWithContentsOfFile:manifestBundlePath];
    if (data.length == 0) {
      return;
    }
    __block NSError *error;
    id manifest = [NSJSONSerialization JSONObjectWithData:data options:0 error:&error];
    if (error) {
      ABI47_0_0EXLogError(@"Error parsing bundled manifest: %@", error);
      return;
    }
    bundledAssets = manifest[@"bundledAssets"];
  });
  return bundledAssets;
}

@end
#endif

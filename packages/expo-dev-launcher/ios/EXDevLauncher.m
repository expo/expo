// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXDevLauncher/EXDevLauncher.h>
#import <EXDevLauncher/EXDevLauncherController.h>

#if __has_include(<EXDevLauncher/EXDevLauncher-Swift.h>)
// For cocoapods framework, the generated swift header will be inside EXDevLauncher module
#import <EXDevLauncher/EXDevLauncher-Swift.h>
#else
#import <EXDevLauncher-Swift.h>
#endif

@implementation EXDevLauncher

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (NSDictionary *)constantsToExport
{
  NSDictionary *rawManifestJSON = [EXDevLauncherController.sharedInstance appManifest].rawManifestJSON;
  NSData *manifestStringData = rawManifestJSON ? [NSJSONSerialization dataWithJSONObject:rawManifestJSON options:kNilOptions error:NULL] : nil;
  NSString *manifestURLString = [EXDevLauncherController.sharedInstance appManifestURL].absoluteString;
  return @{
    @"manifestString": manifestStringData ? [[NSString alloc] initWithData:manifestStringData encoding:NSUTF8StringEncoding] : [NSNull null],
    @"manifestURL": manifestURLString ?: [NSNull null]
  };
}

@end

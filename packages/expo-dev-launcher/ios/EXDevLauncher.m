// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXDevLauncher.h"
#import "EXDevLauncherController.h"

#import <EXDevLauncher-Swift.h>

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

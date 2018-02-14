// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXFrame.h"
#import "EXFrameReactAppManager.h"
#import "EXKernelAppRecord.h"

#import <React/RCTUtils.h>

NSString *kEXKernelBridgeDidForegroundNotification = @"EXKernelBridgeDidForegroundNotification";
NSString *kEXKernelBridgeDidBackgroundNotification = @"EXKernelBridgeDidBackgroundNotification";

@implementation EXKernelAppRecord

+ (instancetype)recordWithManifestUrl:(NSURL *)manifestUrl
{
  return [[EXKernelAppRecord alloc] initWithManifestUrl:manifestUrl];
}

- (instancetype)initWithManifestUrl:(NSURL *)manifestUrl
{
  if (self = [super init]) {
    _manifestUrl = manifestUrl;
    _appLoader = [[EXKernelAppLoader alloc] initWithManifestUrl:manifestUrl];
    _timeCreated = [NSDate date];
    _experienceFinishedLoading = NO;
  }
  return self;
}

- (EXKernelAppRecordStatus)status
{
  if (self.experienceFinishedLoading) {
    return EXKernelAppRecordStatusRunning;
  }
  if (self.appLoader.bundleFinished) {
    return EXKernelAppRecordStatusHasManifestAndBundle;
  }
  if (self.appLoader.manifest) {
    return EXKernelAppRecordStatusHasManifest;
  }
  return EXKernelAppRecordStatusNew;
}

- (NSString * _Nullable)experienceId
{
  if (self.appLoader && self.appLoader.manifest) {
    id experienceIdJsonValue = self.appLoader.manifest[@"id"];
    if (experienceIdJsonValue) {
      RCTAssert([experienceIdJsonValue isKindOfClass:[NSString class]], @"Manifest contains an id which is not a string: %@", experienceIdJsonValue);
      return experienceIdJsonValue;
    }
  }
  return nil;
}

@end


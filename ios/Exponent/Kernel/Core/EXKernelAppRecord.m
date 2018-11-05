// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXReactAppManager.h"
#import "EXAppLoader.h"
#import "EXKernelAppRecord.h"
#import "EXAppViewController.h"

#import <React/RCTUtils.h>

NSString *kEXKernelBridgeDidForegroundNotification = @"EXKernelBridgeDidForegroundNotification";
NSString *kEXKernelBridgeDidBackgroundNotification = @"EXKernelBridgeDidBackgroundNotification";

@implementation EXKernelAppRecord

- (instancetype)initWithManifestUrl:(NSURL *)manifestUrl initialProps:(NSDictionary *)initialProps
{
  if (self = [super init]) {
    _appManager = [[EXReactAppManager alloc] initWithAppRecord:self initialProps:initialProps];
    _appLoader = [[EXAppLoader alloc] initWithManifestUrl:manifestUrl];
    _viewController = [[EXAppViewController alloc] initWithAppRecord:self];
    _timeCreated = [NSDate date];
  }
  return self;
}

- (instancetype)initWithAppLoader:(EXAppLoader *)customAppLoader appManager:(EXReactAppManager *)customAppManager
{
  if (self = [super init]) {
    _appManager = customAppManager;
    _appManager.appRecord = self;
    _appLoader = customAppLoader;
    _viewController = [[EXAppViewController alloc] initWithAppRecord:self];
    _timeCreated = [NSDate date];
  }
  return self;
}

- (EXKernelAppRecordStatus)status
{
  if (_appLoader.status == kEXAppLoaderStatusError) {
    return kEXKernelAppRecordStatusError;
  }
  if (_appManager && _appManager.status == kEXReactAppManagerStatusError && _appLoader.status == kEXAppLoaderStatusHasManifestAndBundle) {
    return kEXKernelAppRecordStatusError;
  }
  if (_appManager && _appManager.isBridgeRunning) {
    return kEXKernelAppRecordStatusRunning;
  }
  if (_appLoader.status == kEXAppLoaderStatusHasManifestAndBundle) {
    return kEXKernelAppRecordStatusBridgeLoading;
  }
  if (_appLoader.status != kEXAppLoaderStatusNew) {
    return kEXKernelAppRecordStatusDownloading;
  }
  return kEXKernelAppRecordStatusNew;
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

- (NSString *)description
{
  return [NSString stringWithFormat:@"EXKernelAppRecord %p:\n  url: %@\n  experience id: %@",
          self,
          self.appLoader.manifestUrl,
          (self.experienceId) ? self.experienceId : @"(none)"];
}

@end


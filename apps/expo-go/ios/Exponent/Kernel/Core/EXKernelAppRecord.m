// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXReactAppManager.h"
#import "EXAppLoaderExpoUpdates.h"
#import "EXKernelAppRecord.h"
#import "EXAppViewController.h"

#import <React/RCTUtils.h>

@import EXManifests;

NSString *kEXKernelBridgeDidForegroundNotification = @"EXKernelBridgeDidForegroundNotification";
NSString *kEXKernelBridgeDidBackgroundNotification = @"EXKernelBridgeDidBackgroundNotification";

@implementation EXKernelAppRecord

- (instancetype)initWithManifestUrl:(NSURL *)manifestUrl initialProps:(NSDictionary *)initialProps
{
  if (self = [super init]) {
    _appManager = [[EXReactAppManager alloc] initWithAppRecord:self initialProps:initialProps];
    _appLoader = [[EXAppLoaderExpoUpdates alloc] initWithManifestUrl:manifestUrl];
    _viewController = [[EXAppViewController alloc] initWithAppRecord:self];
    _timeCreated = [NSDate date];
  }
  return self;
}

- (instancetype)initWithAppLoader:(EXAbstractLoader *)customAppLoader appManager:(EXReactAppManager *)customAppManager
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
  if (_appManager && _appManager.isReactHostRunning) {
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

- (NSString * _Nullable)scopeKey
{
  if (self.appLoader && self.appLoader.manifest) {
    return self.appLoader.manifest.scopeKey;
  }
  return nil;
}

- (NSString *)description
{
  return [NSString stringWithFormat:@"EXKernelAppRecord %p:\n  url: %@\n  experience scope key: %@",
          self,
          self.appLoader.manifestUrl,
          self.scopeKey ?: @"(none)"];
}

@end


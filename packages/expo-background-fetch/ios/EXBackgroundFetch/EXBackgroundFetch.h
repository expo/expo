// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXCore/EXExportedModule.h>
#import <EXCore/EXModuleRegistryConsumer.h>

// Background fetch result
typedef NS_ENUM(NSUInteger, EXBackgroundFetchResult) {
  EXBackgroundFetchResultNoData = 1,
  EXBackgroundFetchResultNewData = 2,
  EXBackgroundFetchResultFailed = 3,
};

// Background fetch status
typedef NS_ENUM(NSUInteger, EXBackgroundFetchStatus) {
  EXBackgroundFetchStatusDenied = 1,
  EXBackgroundFetchStatusRestricted = 2,
  EXBackgroundFetchStatusAvailable = 3,
};

@interface EXBackgroundFetch : EXExportedModule <EXModuleRegistryConsumer>

@end
